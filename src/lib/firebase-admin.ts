import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64) {
        const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(decodedKey);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
        throw new Error("Firebase Admin SDK service account key is not set. Please set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_B64 environment variable.");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error: ", error.message);
    // Log the error but don't re-throw, to allow the app to run in environments
    // where the service account key might not be available (e.g. client-side).
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
export const messaging = admin.messaging();
