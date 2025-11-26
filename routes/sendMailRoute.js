// routes/sendMailRoute.js
import express from 'express';
import createLead from '../controller/sendMailController.js';
import Lead from '../model/mailModel.js';

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

export default router;
