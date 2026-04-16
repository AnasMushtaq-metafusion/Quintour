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
    if (hasPermission) {
      watchId.current = Geolocation.watchPosition(
        (position: any) => {
          const { latitude, longitude } = position.coords;

          setCurrentPosition({ latitude, longitude });
          setSpeed(speed);
        },
        error => console.log(error),
        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          interval: 500,
          fastestInterval: 500,
        },
      );
    }
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
  }, [speed]);

  return currentPosition;
};

const checkLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (granted) {
      return true;
    } else {
      return await requestLocationPermission();
    }
  }
  return true;
};

const requestLocationPermission = async (): Promise<boolean> => {
  try {
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
  } catch (err) {
    console.warn(err);
    return false;
  }
};
