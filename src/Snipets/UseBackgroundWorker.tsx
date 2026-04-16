import { useEffect, useRef } from 'react';
import { _retrieveData } from './Asyncstorage';
import DeviceInfo from 'react-native-device-info';
import { PROD_BASE_URL } from '../Utils/variable';
import { useCurrentPosition } from './CurrentLocation';
import * as Sentry from '@sentry/react-native';

const fetchApiData = async (currentPosition: {
  latitude: any;
  longitude: any;
}) => {
  try {
    if (!currentPosition) {
      console.log('No position available, skipping API call.');
      return;
    }

    const batteryLevel = await DeviceInfo.getBatteryLevel();
    const i_device = await DeviceInfo.getUniqueId();
    const token = await _retrieveData('token');

    const myHeaders = new Headers();
    myHeaders.append('Authorization', `Bearer ${token}`);
    myHeaders.append('Content-Type', 'application/json');

    const raw = JSON.stringify({
      geo_lat: currentPosition.latitude,
      geo_lng: currentPosition.longitude,
      battery_level: Math.round(batteryLevel * 100),
    });

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

    const response = await fetch(
      `${PROD_BASE_URL}/device/${i_device}`,
      requestOptions,
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    console.log('API response:', data);
  } catch (error) {
    Sentry.captureException(error); // <-- send to Sentry

    console.error('API call error:', error);
  }
};

const useBackgroundWorker = () => {
  const currentPosition = useCurrentPosition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (currentPosition) {
      fetchApiData(currentPosition); // Run immediately

      // Set interval to run API call every 15 minutes
      intervalRef.current = setInterval(() => {
        fetchApiData(currentPosition);
      }, 60000); // 1 minute

      console.log('Background worker started.');
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('Background worker stopped.');
      }
    };
  }, []);
};

export default useBackgroundWorker;
