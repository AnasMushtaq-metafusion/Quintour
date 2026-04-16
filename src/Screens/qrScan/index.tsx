//import liraries
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  NativeModules,
  Platform,
  Alert,
  Dimensions,
  useColorScheme,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
  useCameraPermission,
} from 'react-native-vision-camera';
import { getDeviceName, getUniqueId } from 'react-native-device-info';
import { _retrieveData, _storeData } from '../../Snipets/Asyncstorage';
import { PROD_BASE_URL } from '../../Utils/variable';
import { Linking } from 'react-native';
import * as Sentry from '@sentry/react-native';

// create a component
const QRScan = ({ navigation }: any) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [hasScanned, setHasScanned] = useState(false);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (hasScanned || codes.length === 0) return;

      const qrCode = codes[0]?.value;
      if (qrCode) {
        setHasScanned(true);
        fetchData(qrCode);
        // Reactivate after 2 seconds to prevent multiple rapid scans
        setTimeout(() => setHasScanned(false), 2000);
      }
    },
  });

  useEffect(() => {
    _retrieveData('token');
    _retrieveData('refresh_token');
  }, []);

  // iOS:
  const localeiOS =
    NativeModules?.SettingsManager?.settings?.AppleLocale ||
    NativeModules?.SettingsManager?.settings?.AppleLanguages?.[0] ||
    'en_US'; // Default fallback

  // Android:
  const localeAD = NativeModules?.I18nManager?.localeIdentifier || 'en_US'; // Default fallback

  const fetchData = async (data: any) => {
    var myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    // Safely extract language code
    const getLanguageCode = (locale: string): string => {
      if (!locale || locale.length < 5) return 'US'; // Default to US
      return locale.slice(3); // Extract country code from locale (e.g., 'en_US' -> 'US')
    };

    var raw = JSON.stringify({
      code: data,
      name: await getDeviceName(),
      lang:
        Platform.OS === 'ios'
          ? getLanguageCode(localeiOS)
          : getLanguageCode(localeAD),
      type: await getUniqueId(),
    });

    // console.log(raw)

    var requestOptions: any = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

    // console.log(BASE_URL);

    await fetch(`${PROD_BASE_URL}/device/register`, requestOptions)
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      })
      .then(result => {
        _storeData('token', result?.token);
        _storeData('refresh_token', result?.refresh_token);

        setTimeout(() => {
          navigation.replace('welcome');
        }, 200);
      })
      .catch(error => {
        Sentry.captureException(error); // <-- send to Sentry

        Alert.alert('Invalid QR Code', 'The scanned QR code is not valid.');
        console.log('QR error', error);
      });
  };

  useEffect(() => {
    const checkPermission = async () => {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Camera Permission Required',
            'This app needs camera access to scan QR codes. Please enable camera permission in settings.',
            [
              {
                text: 'Cancel',
                onPress: () => navigation.goBack(),
                style: 'cancel',
              },
              {
                text: 'Open Settings',
                onPress: () => {
                  Linking.openSettings();
                  navigation.goBack();
                },
              },
            ],
          );
        }
      }
    };
    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]);

  if (!device) {
    return <SafeAreaView style={backgroundStyle} />;
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}
      >
        <View
          style={{
            backgroundColor: isDarkMode ? '#000000' : '#ffffff',
          }}
        >
          <View style={styles.container}>
            {hasPermission && device && (
              <View style={styles.cameraContainer}>
                <Camera
                  style={styles.camera}
                  device={device}
                  isActive={true}
                  codeScanner={codeScanner}
                />
                <View style={styles.markerContainer}>
                  <View style={styles.marker} />
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// define your styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
    flex: 1,
    position: 'relative',
  },
  camera: {
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
    flex: 1,
  },
  markerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'green',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  centerText: {
    flex: 1,
    fontSize: 20,
    padding: 20,
    color: 'black',
    backgroundColor: 'grey',
    margin: 10,
  },
  textBold: {
    fontWeight: '500',
    color: '#000',
  },
  buttonText: {
    fontSize: 21,
    color: 'rgb(0,122,255)',
  },
  buttonTouchable: {
    padding: 16,
  },
});

//make this component available to the app
export default QRScan;
