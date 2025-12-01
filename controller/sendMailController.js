import axios from "axios";
import Lead from "../model/mailModel.js";
import Token from "../model/tokenModel.js";
import admin from "../utils/firebaseAdmin.js";

const createLead = async (req, res) => {
  try {
    const { name, email, message, token } = req.body;

    const skipTurnstile = (process.env.SKIP_TURNSTILE === "true") || (process.env.NODE_ENV === "development");

    if (!name || !email || (!token && !skipTurnstile)) {
      return res.status(400).json({ msg: "Please fill required fields and verify captcha (or enable SKIP_TURNSTILE for dev)" });
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!validEmail.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    // Turnstile verification (skippable in dev)
    if (!skipTurnstile) {
      const secret = process.env.TURNSTILE_SECRET_KEY;
      const verifyUrl = `https://challenges.cloudflare.com/turnstile/v0/siteverify`;
      const response = await axios.post(
        verifyUrl,
        new URLSearchParams({ secret, response: token }).toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (!response.data.success) {
        return res.status(400).json({ msg: "Captcha verification failed" });
      }
    } else {
      console.log("Skipping Turnstile verification (dev mode)");
    }

    // Save lead
    const lead = new Lead({ name, email, message });
    await lead.save();

    // Emit socket.io event
    try {
      const io = req.app.get("io");
      if (io) io.emit("new-lead", lead);
    } catch (emitErr) {
      console.warn("Failed to emit new-lead event:", emitErr);
    }

    // Send FCM notifications per-token (compatible approach)
    try {
      const tokenDocs = await Token.find().select("token -_id").lean();
      const registrationTokens = tokenDocs.map(t => t.token).filter(Boolean);

      console.log("Found device tokens:", registrationTokens.length);

      if (registrationTokens.length === 0) {
        console.log("No tokens found — skipping FCM send.");
      } else {
        const promises = registrationTokens.map((deviceToken) => {
          const msg = {
            token: deviceToken,
            notification: {
              title: "New Lead",
              body: `${lead.name} — ${lead.email}`,
            },
            data: {
              _id: lead._id.toString(),
              name: lead.name,
              email: lead.email,
              message: lead.message || "",
              type: "new-lead",
            },
          };

          return admin.messaging().send(msg)
            .then((messageId) => ({ ok: true, token: deviceToken, messageId }))
            .catch((err) => ({ ok: false, token: deviceToken, err }));
        });

        const results = await Promise.all(promises);

        const failed = results.filter(r => !r.ok);
        const success = results.filter(r => r.ok);

        console.log(`FCM results: success=${success.length}, failed=${failed.length}`);

        const tokensToRemove = failed
          .filter(r => {
            const code = r.err?.errorInfo?.code || r.err?.code || r.err?.message || "";
            return (
              code.includes("not-registered") ||
              code.includes("InvalidRegistration") ||
              code.includes("invalid-registration-token")
            );
          })
          .map(r => r.token);

        if (tokensToRemove.length > 0) {
          await Token.deleteMany({ token: { $in: tokensToRemove } });
          console.log("Removed invalid tokens:", tokensToRemove.length);
        }
      }
    } catch (fcmErr) {
      console.error("Error sending FCM:", fcmErr);
    }

    return res.status(201).json({ msg: "Lead created successfully", lead });
  } catch (e) {
    console.error("createLead error:", e);
    res.status(500).json({ msg: e.message });
  }
};

export default createLead;
