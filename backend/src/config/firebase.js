import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

// Initialize Firebase Admin SDK
try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('[Firebase] Initialized with local serviceAccountKey.json');
  } else {
    // Fallback for Cloud Run which uses Default Application Credentials
    admin.initializeApp();
    console.log('[Firebase] Initialized with Default Application Credentials');
  }
} catch (error) {
  console.error('[Firebase] Failed to initialize Firebase Admin:', error.message);
  // Do not crash the app immediately; the mock DB might be active.
}

const db = admin.firestore ? admin.firestore() : null;

export { admin, db };
