// controller/sendMailController.js
import axios from "axios";
import Lead from "../model/mailModel.js";

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

    // Save lead if captcha is valid
    const lead = new Lead({ name, email, message });
    await lead.save();

    // Emit socket event to connected clients (if io exists)
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('new-lead', lead);
      }
    } catch (emitErr) {
      console.warn('Failed to emit new-lead event:', emitErr);
    }

    return res.status(201).json({ msg: "Lead created successfully", lead });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
};

export default createLead;
