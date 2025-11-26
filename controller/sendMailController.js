// controller/sendMailController.js
import axios from "axios";
import Lead from "../model/mailModel.js";
import Token from "../model/tokenModel.js";
import admin from "../utils/firebaseAdmin.js";

/**
 * createLead controller
 * - verifies Cloudflare Turnstile token
 * - saves lead to Mongo
 * - emits socket.io 'new-lead'
 * - sends FCM multicast notification using admin.messaging().sendMulticast()
 * - removes invalid device tokens from DB
 */
const createLead = async (req, res) => {
  try {
    const { name, email, message, token } = req.body;

    if (!name || !email || !token) {
      return res.status(400).json({ msg: "Please fill required fields and verify captcha" });
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!validEmail.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    // Verify Cloudflare Turnstile token
    const secret = process.env.TURNSTILE_SECRET_KEY;
    const verifyUrl = `https://challenges.cloudflare.com/turnstile/v0/siteverify`;

    const response = await axios.post(
      verifyUrl,
      new URLSearchParams({
        secret,
        response: token
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (!response.data.success) {
      return res.status(400).json({ msg: "Captcha verification failed" });
    }

    // Save lead
    const lead = new Lead({ name, email, message });
    await lead.save();

    // Emit socket.io event if available
    try {
      const io = req.app.get("io");
      if (io) io.emit("new-lead", lead);
    } catch (emitErr) {
      console.warn("Failed to emit new-lead event:", emitErr);
    }

    // Send FCM multicast to all registered tokens
    try {
      const tokenDocs = await Token.find().select("token -_id").lean();
      const registrationTokens = tokenDocs.map(t => t.token).filter(Boolean);

      if (registrationTokens.length > 0) {
        const message = {
          tokens: registrationTokens,
          notification: {
            title: "New Lead",
            body: `${lead.name} — ${lead.email}`
          },
          data: {
            _id: lead._id.toString(),
            name: lead.name,
            email: lead.email,
            message: lead.message || "",
            type: "new-lead"
          }
        };

        const fcmResponse = await admin.messaging().sendMulticast(message);

        console.log("FCM multicast response:", {
          successCount: fcmResponse.successCount,
          failureCount: fcmResponse.failureCount
        });

        // Collect invalid tokens to remove
        const tokensToRemove = [];
        fcmResponse.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const err = resp.error;
            console.warn(`FCM error for token ${registrationTokens[idx]}:`, err?.code || err?.message || err);
            if (
              err &&
              (err.code === "messaging/invalid-registration-token" ||
                err.code === "messaging/registration-token-not-registered" ||
                err.code === "messaging/invalid-argument")
            ) {
              tokensToRemove.push(registrationTokens[idx]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          await Token.deleteMany({ token: { $in: tokensToRemove } });
          console.log("Removed invalid FCM tokens:", tokensToRemove.length);
        }
      } else {
        console.log("No registration tokens found — skipping FCM send.");
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
