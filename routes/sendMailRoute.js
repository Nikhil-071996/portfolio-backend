// routes/sendMailRoute.js
import express from 'express';
import createLead from '../controller/sendMailController.js';
import Lead from '../model/mailModel.js';
import Token from '../model/tokenModel.js';

const router = express.Router();

router.post('/create', createLead);

// GET /api/send-mail  -> list leads
router.get('/', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }).limit(500);
    res.json(leads);
  } catch (err) {
    console.error('Failed to fetch leads:', err);
    res.status(500).json({ msg: 'Failed to fetch leads' });
  }
});


router.post('/register-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ msg: 'No token provided' });

    // Upsert token
    await Token.updateOne({ token }, { token }, { upsert: true });
    res.status(201).json({ msg: 'Token registered' });
  } catch (err) {
    console.error('Failed to register token:', err);
    res.status(500).json({ msg: 'Failed to register token' });
  }
});

export default router;
