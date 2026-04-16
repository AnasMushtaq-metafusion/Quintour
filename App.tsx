/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// b23752df-1715-4abd-8e8f-7ed45c065256
import * as React from 'react';
import KeepAwake from './src/Snipets/KeepAwakeComponent';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ImmersiveMode from 'react-native-immersive-mode';

const Stack = createNativeStackNavigator();

import QRScan from './src/Screens/qrScan';

import SplashScreen from 'react-native-splash-screen';

import Splash from './src/Screens/Splash/Index';
import Welcome from './src/Screens/Welcome/Index';
import Map from './src/Screens/Map/Index';
import Buttons from './src/Screens/Buttons';
import TourSingle from './src/Screens/TourSingle/Index';
import TourEnd from './src/Screens/TourSingle/End';
import TourMap from './src/Screens/TourSingle/Map/Index';
import TourVideoScreen from './src/Screens/TourSingle/Video';
import TourWebViewScreen from './src/Screens/TourSingle/WebView';
import { useNetInfo } from '@react-native-community/netinfo';
import { Alert, Platform } from 'react-native';
import TourQuiz from './src/Screens/TourSingle/Quiz/Index';
import TourEndAfterStart from './src/Screens/TourSingle/EndAfterStart';
import PlayAudio from './src/Screens/TourSingle/Audio/Index';
import { TimerProvider } from './src/Snipets/TimeContext';
import { GlobalProvider } from './src/Snipets/GlobalContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import * as Sentry from '@sentry/react-native';
import TourInfo from './src/Screens/TourSingle/Info';
import TourPictureScreen from './src/Screens/TourSingle/Picture';
import PictureUploadScreen from './src/Screens/TourSingle/PictureUploadScreen';

import LockScreen from './src/Screens/LockScreen';
import {
  _removeData,
  _retrieveData,
  _storeData,
} from './src/Snipets/Asyncstorage';
import { PROD_BASE_URL } from './src/Utils/variable';

Sentry.init({
  dsn: 'https://74f451ce45f9e83008f9ecdca7855fc5@o4507644086779904.ingest.de.sentry.io/4507843830022224',
  tracesSampleRate: 1.0,
  _experiments: {
    profilesSampleRate: 0.1,
  },

  enableAutoPerformanceTracing: true,
  enableAppHangTracking: true,
  enableCaptureFailedRequests: true,
});

function App(): React.JSX.Element {
  const { isConnected } = useNetInfo();

  const refreshToken = async () => {
    const retrievedToken = await _retrieveData('refresh_token');

    if (!retrievedToken) return;

    var myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    var raw = JSON.stringify({
      token: retrievedToken,
    });

    var requestOptions: any = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

    await fetch(`${PROD_BASE_URL}/device/refresh`, requestOptions)
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      })
      .then(result => {
        _storeData('token', result?.token);
        _storeData('refresh_token', result?.refresh_token);
      })
      .catch(async error => {
        await _removeData('token');
        await _removeData('refresh_token');
        console.log('refresh token error error', error);
        Sentry.captureException(error); // <-- send to Sentry
      });
  };

  React.useEffect(() => {
    ImmersiveMode.fullLayout(true); // Allows app layout under nav bar
    ImmersiveMode.setBarMode('FullSticky'); // Hides bottom nav bar
    if (Platform.OS === 'ios') {
      SplashScreen.hide();
    }

    setTimeout(() => {
      refreshToken();
    }, 100); // ⏱️ Run after a small delay
  }, []);

  React.useEffect(() => {
    if (isConnected === false) {
      setTimeout(() => {
        Alert.alert(`You are offline...`);
      }, 500); // Show later
    }
  }, [isConnected]);

  return (
    <>
      <KeepAwake />
      <TimerProvider>
        <GlobalProvider>
          <I18nextProvider i18n={i18n}>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  headerStyle: {
                    backgroundColor: '#f4511e',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
                initialRouteName="Home"
              >
                <Stack.Screen
                  name="Home"
                  component={Splash}
                  options={{ title: 'Welcome' }}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'QRScan' }}
                  name="QRScan"
                  component={QRScan}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Welcome' }}
                  name="welcome"
                  component={Welcome}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Map' }}
                  name="map"
                  component={Map}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Tour Map' }}
                  name="tourmap"
                  component={TourMap}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Tour Video' }}
                  name="tourvideo"
                  component={TourVideoScreen}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Tour Audio' }}
                  name="touraudio"
                  component={PlayAudio}
                />
                <Stack.Screen
                  options={{
                    headerShown: false,
                    title: 'Tour WebViewScreen',
                  }}
                  name="tourwebview"
                  component={TourWebViewScreen}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Buttons' }}
                  name="buttons"
                  component={Buttons}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Tour Single' }}
                  name="toursingle"
                  component={TourSingle}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Tour End' }}
                  name="tourend"
                  component={TourEnd}
                />
                <Stack.Screen
                  options={{
                    headerShown: false,
                    title: 'Tour End After Start',
                  }}
                  name="tourendafterstart"
                  component={TourEndAfterStart}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Tour Quiz' }}
                  name="tourquiz"
                  component={TourQuiz}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Tour Info' }}
                  name="tourinfo"
                  component={TourInfo}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Tour Picture' }}
                  name="tourpicture"
                  component={TourPictureScreen}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Lock Screen' }}
                  name="lockscreen"
                  component={LockScreen}
                />
                <Stack.Screen
                  options={{ headerShown: false, title: 'Picture Upload' }}
                  name="pictureupload"
                  component={PictureUploadScreen}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </I18nextProvider>
        </GlobalProvider>
      </TimerProvider>
    </>
  );
}

export default Sentry.wrap(App);
