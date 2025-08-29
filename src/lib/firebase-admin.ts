
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Messaging } from 'firebase-admin/messaging';

interface FirebaseAdmin {
  app: App;
  auth: Auth;
  db: Firestore;
  messaging: Messaging;
}

let adminInstance: FirebaseAdmin | null = null;

function initializeFirebaseAdmin(): FirebaseAdmin {
  if (admin.apps.length > 0) {
    if (adminInstance) return adminInstance;
    const app = admin.app();
    adminInstance = {
        app,
        auth: admin.auth(app),
        db: admin.firestore(app),
        messaging: admin.messaging(app),
    }
    return adminInstance;
  }

  try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64) {
      const decodedKey = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64, 'base64').toString('utf-8');
      serviceAccount = JSON.parse(decodedKey);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
      throw new Error("Firebase Admin SDK service account key is not set. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_B64.");
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
    
    adminInstance = {
        app,
        auth: admin.auth(app),
        db: admin.firestore(app),
        messaging: admin.messaging(app),
    };
    return adminInstance;

  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error: ", error.message);
    // Return a dummy object or throw, depending on desired behavior for failed init
    // For now, re-throwing makes it clear that server-side functionality will fail.
    throw new Error(`Firebase Admin SDK failed to initialize: ${error.message}`);
  }
}

// Safely get the initialized instance
function getFirebaseAdmin(): FirebaseAdmin {
    if (!adminInstance) {
        adminInstance = initializeFirebaseAdmin();
    }
    return adminInstance;
}

// Export a function to get the services, not the services directly
export const getAdminServices = () => {
    try {
        const { auth, db, messaging } = getFirebaseAdmin();
        return { auth, db, messaging, success: true };
    } catch (error) {
        console.error("Could not get Firebase Admin services:", (error as Error).message);
        // Fallback for environments where admin SDK is not available/needed
        return { auth: null, db: null, messaging: null, success: false };
    }
}
