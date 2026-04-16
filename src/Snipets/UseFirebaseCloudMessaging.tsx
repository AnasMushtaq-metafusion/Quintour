import { useEffect } from 'react';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import {
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  setBackgroundMessageHandler,
  onMessage,
} from '@react-native-firebase/messaging';
import { _retrieveData, _storeData } from './Asyncstorage';
import { PROD_BASE_URL } from '../Utils/variable';
import * as Sentry from '@sentry/react-native';

/**
 * Custom Hook for Firebase Cloud Messaging
 * Handles FCM token generation, permission requests, and message handling
 */
const useFirebaseCloudMessaging = () => {
  /**
   * Step 1: Get FCM token from Firebase
   */
  const getFirebaseCloudMessageToken = async () => {
    try {
      console.log('🔄 Requesting FCM token...');
      const token = await getToken(getMessaging());

      if (token) {
        console.log('✅ FCM Token obtained:', token);
        // Store token locally
        await _storeData('fcm_token', token);
        // Send to backend
        await handlePushToken(token);
      } else {
        console.warn('⚠️ No FCM token received');
      }
    } catch (error) {
      console.error('❌ Failed to get FCM token:', error);
      Sentry.captureException(error);
    }
  };

  /**
   * Step 2: Request notification permission (Android 13+)
   * iOS handles permissions via Info.plist and app delegate
   */
  const requestUserPermission = async () => {
    console.log('📍 Current platform:', Platform.OS);
    console.log('📍 Android version:', Platform.Version);

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        console.log(
          '🔐 Requesting POST_NOTIFICATIONS permission (Android 13+)...',
        );
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message:
              'This app needs notification permission to send you updates',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Notification permission granted');
          getFirebaseCloudMessageToken();
        } else {
          console.log('❌ Notification permission denied');
          Alert.alert(
            'Permission Denied',
            "You won't receive push notifications",
          );
        }
      } catch (error) {
        console.error('❌ Error requesting notification permission:', error);
        Sentry.captureException(error);
      }
    } else {
      // iOS and Android < 13 - permissions handled elsewhere
      console.log('ℹ️ Skipping permission request (handled by system)');
      getFirebaseCloudMessageToken();
    }
  };

  /**
   * Step 3: Send FCM token to backend server
   * This allows the server to send targeted push notifications
   */
  const handlePushToken = async (token: string) => {
    try {
      console.log('📤 Sending FCM token to backend...');
      const authToken = await _retrieveData('token');

      if (!authToken) {
        console.warn('⚠️ No authentication token available');
        return;
      }

      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', `Bearer ${authToken}`);
      headers.append('Cookie', 'SERVERID=webserver4');

      const body = JSON.stringify({ token });

      const response = await fetch(`${PROD_BASE_URL}/device/push`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Token sent to backend successfully:', result);
    } catch (error) {
      console.error('❌ Error sending token to backend:', error);
      Sentry.captureException(error);
    }
  };

  /**
   * Main effect: Setup all FCM listeners
   */
  useEffect(() => {
    console.log('🚀 Setting up Firebase Cloud Messaging...');

    // Request permission and get token
    requestUserPermission();

    const messagingInstance = getMessaging();

    /**
     * Listen for messages in foreground
     * Note: Specific screens may add their own handlers for custom actions
     */
    const unsubscribeOnMessage = onMessage(messagingInstance, remoteMessage => {
      console.log('📬 Foreground message received:', remoteMessage);

      if (remoteMessage.notification) {
        console.log('Title:', remoteMessage.notification.title);
        console.log('Body:', remoteMessage.notification.body);

        // Show alert for general notifications
        if (!remoteMessage.data?.todo) {
          Alert.alert(
            remoteMessage.notification.title || 'Notification',
            remoteMessage.notification.body || '',
          );
        }
      }

      if (remoteMessage.data) {
        console.log('Data payload:', remoteMessage.data);
      }
    });

    /**
     * Listen for notification opened from background/quit state
     */
    const unsubscribeOnNotificationOpenedApp = onNotificationOpenedApp(
      messagingInstance,
      remoteMessage => {
        console.log('📌 App opened from notification:', remoteMessage);

        if (remoteMessage?.notification) {
          console.log('Notification data:', remoteMessage.notification);
        }

        if (remoteMessage?.data) {
          console.log('Data:', remoteMessage.data);
        }
      },
    );

    /**
     * Set up handler for background messages (Android)
     * This is called when app is killed and a message arrives
     */
    setBackgroundMessageHandler(messagingInstance, async remoteMessage => {
      console.log('🔕 Background message handled:', remoteMessage);

      if (remoteMessage?.data) {
        // Store for later processing
        await _storeData('background_message', JSON.stringify(remoteMessage));
      }

      return Promise.resolve();
    });

    /**
     * Listen for token refresh
     * Firebase generates a new token periodically
     */
    const unsubscribeTokenRefresh = messagingInstance.onTokenRefresh(
      newToken => {
        console.log('🔄 New FCM token generated:', newToken);
        _storeData('fcm_token', newToken);
        handlePushToken(newToken);
      },
    );

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🧹 Cleaning up Firebase Cloud Messaging listeners');
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpenedApp();
      unsubscribeTokenRefresh();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default useFirebaseCloudMessaging;
