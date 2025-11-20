import express from 'express'
import createLead from '../controller/sendMailController.js';

const router = express.Router();


router.post('/create', createLead)

export default router