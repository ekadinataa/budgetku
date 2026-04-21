import admin from 'firebase-admin';

// In Cloud Functions, Firebase Admin SDK auto-initializes with default credentials
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export { admin };
