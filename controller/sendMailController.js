import axios from "axios";
import Lead from "../model/mailModel.js";
import Token from "../model/tokenModel.js";
import admin from '../utils/firebaseAdmin.js'; // NEW

const createLead = async (req, res) => {
  try {
    const { name, email, message, token } = req.body;

    if (!name || !email || !token) {
      return res.status(400).json({ msg: "Please fill required fields and verify captcha" });
    }

    // ... Turnstile verification (unchanged) ...

    const lead = new Lead({ name, email, message });
    await lead.save();

    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io) io.emit('new-lead', lead);
    } catch (emitErr) {
      console.warn('Failed to emit new-lead event:', emitErr);
    }

    // SEND FCM PUSH to registered device tokens
    try {
      const tokens = await Token.find().select('token -_id').lean();
      const registrationTokens = tokens.map(t => t.token).filter(Boolean);

      if (registrationTokens.length > 0) {
        // Construct payload
        const payload = {
          notification: {
            title: 'New Lead',
            body: `${lead.name} — ${lead.email}`,
          },
          data: {
            _id: lead._id.toString(),
            name: lead.name,
            email: lead.email,
            message: lead.message || '',
            type: 'new-lead'
          }
        };

        const response = await admin.messaging().sendToDevice(registrationTokens, payload);

        // Cleanup invalid tokens: remove those with errors
        const tokensToRemove = [];
        response.results.forEach((result, idx) => {
          const error = result.error;
          if (error) {
            console.warn('FCM error for token:', registrationTokens[idx], error.message);
            // If token is invalid, push to removal list
            if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
              tokensToRemove.push(registrationTokens[idx]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          await Token.deleteMany({ token: { $in: tokensToRemove } });
        }
      }
    } catch (fcmErr) {
      console.error('Error sending FCM:', fcmErr);
    }

    return res.status(201).json({ msg: "Lead created successfully", lead });

  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: e.message });
  }
};

export default createLead;
