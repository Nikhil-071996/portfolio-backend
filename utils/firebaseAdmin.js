// utils/firebaseAdmin.js
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

function loadServiceAccount() {
  // 1) Try explicit path (useful for local file)
  const pathEnv = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
  if (pathEnv) {
    const p = path.resolve(pathEnv);
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to read/parse GOOGLE_SERVICE_ACCOUNT_PATH', e);
      }
    } else {
      console.warn('GOOGLE_SERVICE_ACCOUNT_PATH set but file not found:', p);
    }
  }

  // 2) Try raw JSON env var
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      return JSON.parse(rawJson);
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON', e);
    }
  }

  // 3) Try base64 env var
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (b64) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (e) {
      console.error('Failed to decode/parse GOOGLE_SERVICE_ACCOUNT_JSON_BASE64', e);
    }
  }

  return null;
}

const serviceAccount = loadServiceAccount();

if (!admin.apps.length) {
  if (!serviceAccount) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env variable, path, or base64 variant");
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
