// Import libraries
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  _getIsLockScreen,
  _getIsTourStarted,
  _getTourItemDetails,
  _removeTourStarted,
  _removeTourTargetNode,
  _retrieveData,
  _storeData,
} from '../../Snipets/Asyncstorage';
import { NativeModules } from 'react-native';
import { getDeviceName, getUniqueId } from 'react-native-device-info';
import { COLOR, PROD_BASE_URL } from '../../Utils/variable';
import { useTranslation } from 'react-i18next';
import ConfirmPopup from '../../Snipets/ConfirmPopup';
import * as Sentry from '@sentry/react-native';

const { MyDeviceOwnerProvision } = NativeModules;

// Create a component
const Splash = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [confirmPopup, setConfirmPopup] = useState(false);

  const { t } = useTranslation(['common', 'tour']);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const myHeaders = new Headers();
      myHeaders.append('Authorization', `Bearer ${token}`);

      const response = await fetch(`${PROD_BASE_URL}/tours`, {
        method: 'GET',
        headers: myHeaders,
      });

      return response.ok;
    } catch (error) {
      console.log('Token validation error', error);
      return false;
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = await _retrieveData('refresh_token');
      if (!refreshToken) return false;

      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');

      const raw = JSON.stringify({
        refresh_token: refreshToken,
      });

      const response = await fetch(`${PROD_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: myHeaders,
        body: raw,
      });

      if (!response.ok) return false;

      const result = await response.json();

      if (result?.token) {
        await _storeData('token', result.token);
        if (result?.refresh_token) {
          await _storeData('refresh_token', result.refresh_token);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.log('Token refresh error', error);
      Sentry.captureException(error);
      return false;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const data = await getProvisioningData();

      if (data) {
        fetchData(data);
      } else {
        const retrievedToken = await _retrieveData('token');

        if (retrievedToken) {
          // Validate token first
          const isValid = await validateToken(retrievedToken);

          if (!isValid) {
            // Try to refresh the token
            const refreshed = await refreshAccessToken();

            if (!refreshed) {
              // Token refresh failed, clear storage and show loading
              await _storeData('token', '');
              await _storeData('refresh_token', '');
              setTimeout(() => {
                setLoading(false);
              }, 500);
              return;
            }
          }

          const tourStarted = await _getIsTourStarted();
          const isLockScreen = await _getIsLockScreen();

          if (isLockScreen === 'true') {
            navigation.replace('lockscreen');
          } else if (tourStarted) {
            setConfirmPopup(true);
          } else {
            navigation.replace('welcome');
          }
        }
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    initialize();
  }, []);

  const getProvisioningData = async () => {
    try {
      const data = await MyDeviceOwnerProvision.getProvisioningData();
      console.log('Provisioning data:', data);
      return data;
    } catch (error) {
      return null;
    }
  };
  const localeiOS =
    NativeModules?.SettingsManager?.settings?.AppleLocale ||
    NativeModules?.SettingsManager?.settings?.AppleLanguages?.[0];

  const localeAD = NativeModules?.I18nManager?.localeIdentifier;

  const fetchData = async (data: any) => {
    var myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    var raw = JSON.stringify({
      code: data,
      name: await getDeviceName(),
      lang: Platform.OS === 'ios' ? localeiOS.slice(3) : localeAD.slice(3),
      type: await getUniqueId(),
    });

    var requestOptions: any = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

    try {
      const response = await fetch(
        `${PROD_BASE_URL}/device/register`,
        requestOptions,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);

      // Only proceed if both tokens are received
      if (result?.token && result?.refresh_token) {
        _storeData('token', result.token);
        _storeData('refresh_token', result.refresh_token);

        setTimeout(() => {
          setLoading(false);
          navigation.replace('welcome');
        }, 200);
      } else {
        throw new Error('Missing token or refresh_token in response');
      }
    } catch (error) {
      console.log('Device registration error', error);
      Sentry.captureException(error); // <-- send to Sentry
      setLoading(false);
    }
  };

  const handleStartTour = async () => {
    const itemDetails = await _getTourItemDetails();
    const tourStarted = await _getIsTourStarted();

    navigation.replace('toursingle', {
      itemId: itemDetails?.itemId,
      itemImg: itemDetails?.itemImg,
      itemMode: itemDetails?.itemMode,
      itemDuration: itemDetails?.itemDuration,
      layoutImage: itemDetails?.layoutImage,
      tourStarted,
    });
  };

  if (loading) {
    return (
      <View style={styles.containerIndicator}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('common:welcome')}!</Text>
      <TouchableOpacity
        onPress={() => {
          navigation.replace('QRScan');
        }}
      >
        <Text style={styles.button}>Scan</Text>
      </TouchableOpacity>

      {confirmPopup && (
        <ConfirmPopup
          onClick={() => {
            handleStartTour();
          }}
          onCancel={() => {
            _removeTourTargetNode();
            _removeTourStarted();

            navigation.replace('lockscreen');

            setConfirmPopup(!confirmPopup);
          }}
          subHeading={t('tour:tour_interruption_text')}
        />
      )}
    </View>
  );
};

// Define your styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 20,
    color: '#fff',
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },

  containerIndicator: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.White,
  },
});

// Make this component available to the app
export default Splash;
