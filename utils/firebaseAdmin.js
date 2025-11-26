// utils/firebaseAdmin.js
import admin from 'firebase-admin';

const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

if (!raw) {
  throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env variable");
}

const serviceAccount = JSON.parse(raw);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
