'use client';

import { useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { useAuth } from '@/auth/provider';
import { saveFcmToken } from '@/app/profile/actions';
import { useToast } from '@/hooks/use-toast';

export function FcmTokenManager() {
  const { user, userDetails } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && user) {
      const messaging = getMessaging(app);

      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');

          getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })
            .then(currentToken => {
              if (currentToken) {
                // Check if the token is new or has changed
                if (currentToken !== userDetails?.fcmToken) {
                  console.log('New or updated FCM Token:', currentToken);
                  // Save the token to your server
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
    }
  }, [user, userDetails, toast]);

  return null; // This component does not render anything
}
