// This file must be in the public folder.

importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// This is a placeholder. The SDK will automatically try to find and use
// the VAPID key provided in the NEXT_PUBLIC_FIREBASE_VAPID_KEY environment variable.
// However, to get the service worker to register, we need to initialize the app.
// The config values will be automatically replaced by the SDK if they are available
// in the environment.
firebase.initializeApp(JSON.parse(new URL(location).searchParams.get("firebaseConfig")));

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192x192.png", // Or your desired icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
