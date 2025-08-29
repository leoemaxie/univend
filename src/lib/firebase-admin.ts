import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
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
