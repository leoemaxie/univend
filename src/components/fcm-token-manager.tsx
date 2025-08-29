
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { useAuth } from '@/auth/provider';
import { saveFcmToken } from '@/app/profile/actions';
import { useToast } from '@/hooks/use-toast';

function buildServiceWorkerUrl() {
    const config = app.options;
    const params = new URLSearchParams({
        apiKey: config.apiKey!,
        authDomain: config.authDomain!,
        projectId: config.projectId!,
        storageBucket: config.storageBucket!,
        messagingSenderId: config.messagingSenderId!,
        appId: config.appId!,
        measurementId: config.measurementId!
    });
    return `/firebase-messaging-sw.js?${params.toString()}`;
}

export function FcmTokenManager() {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && user) {
      const messaging = getMessaging(app);
      const serviceWorkerUrl = buildServiceWorkerUrl();

      navigator.serviceWorker.register(serviceWorkerUrl)
        .then((registration) => {
            console.log('Service worker registered successfully:', registration);
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                console.log('Notification permission granted.');
    
                getToken(messaging, { serviceWorkerRegistration: registration, vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })
                    .then(currentToken => {
                    if (currentToken) {
                        if (currentToken !== userDetails?.fcmToken) {
                        console.log('New or updated FCM Token:', currentToken);
                        saveFcmToken(user.uid, currentToken)
                            .then(result => {
                                if(result.success) {
                                    console.log("FCM token saved successfully.");
                                } else {
                                    console.error("Failed to save FCM token:", result.error);
                                }
                            });
                        }
                    } else {
                        console.log('No registration token available. Request permission to generate one.');
                        toast({
                            variant: 'destructive',
                            title: 'Notifications Disabled',
                            description: 'Could not get notification token. Please enable notifications in your browser settings.'
                        })
                    }
                    })
                    .catch(err => {
                    console.error('An error occurred while retrieving token. ', err);
                    toast({
                        variant: 'destructive',
                        title: 'Notification Error',
                        description: 'An error occurred while setting up notifications.'
                    })
                    });
                }
            });
        }).catch(err => {
            console.error('Service worker registration failed:', err);
        });

    }
  }, [user, userDetails, toast]);

  return null; // This component does not render anything
}
