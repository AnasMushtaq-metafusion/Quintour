import { useState, useEffect, useRef } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { useCurrentLocation } from './GlobalContext';
import { PermissionsAndroid, Platform } from 'react-native';

export const useCurrentPosition = () => {
  const { currentPosition, setCurrentPosition } = useCurrentLocation();
  const [speed, setSpeed] = useState<number | null>(null);

  const watchId = useRef<number | null>(null);

  const startWatchingPosition = async () => {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission) {
      console.log('Location permission not granted');
      return;
    }

    // First try to get current position to verify location services work
    Geolocation.getCurrentPosition(
      position => {
        console.log('Initial position obtained:', position.coords);
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ latitude, longitude });

        // Then start watching
        watchId.current = Geolocation.watchPosition(
          (position: any) => {
            const { latitude, longitude } = position.coords;
            setCurrentPosition({ latitude, longitude });
            setSpeed(position.coords.speed);
          },
          error => {
            console.log('Watch position error:', error);
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 5,
            interval: 500,
            fastestInterval: 500,
          },
        );
      },
      error => {
        console.log('Initial location error:', error);
        console.log(
          'Make sure location is set in iOS Simulator: Features > Location > Custom Location',
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  const stopWatchingPosition = () => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  useEffect(() => {
    startWatchingPosition();

    return () => {
      stopWatchingPosition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  return currentPosition;
};

const checkLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    try {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    } catch (error) {
      console.log('iOS permission error:', error);
      return false;
    }
  } else if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (granted) {
      return true;
    } else {
      return await requestLocationPermission();
    }
  }
  return false;
};

const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  } catch (err) {
    console.warn(err);
    return false;
  }
};
