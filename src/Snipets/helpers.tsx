import { captureScreen } from 'react-native-view-shot';
import {
  _getTourPreviousNode,
  _isLockScreen,
  _removeTourItemDetails,
  _removeTourPreviousNode,
  _removeTourStarted,
  _removeTourTargetNode,
  _retrieveData,
} from './Asyncstorage';
import DeviceInfo from 'react-native-device-info';
import i18n from 'i18next';
import * as Sentry from '@sentry/react-native';
import { PROD_BASE_URL } from '../Utils/variable';

interface RemoteMessage {
  data?: {
    todo?: string;
  };
}

export const handleRemoteMessage = async (
  remoteMessage: RemoteMessage,
  navigation: any,
  runTourData: () => void,
  getCountLocation: (count: number) => void,
  subScore: (score: number) => void,
  isScore: number,
  itemId: string,
  itemMode: string,
  itemDuration: null | number,
  layoutImage: object,
  tourRunID: number,
  isFocused: boolean,
) => {
  const todo = remoteMessage.data?.todo;

  switch (todo) {
    case 'rmt_next_screen':
      runTourData();
      break;
    case 'rmt_prev_screen':
      await _getTourPreviousNode().then(res => {
        if (res !== undefined) {
          navigation.replace(res?.type, {
            data: res?.data,
            id: res?.id,
            nodes: res?.nodes,
            edges: res?.edges,
            itemMode: res?.itemMode,
            itemId: res?.itemId,
            itemDuration: res?.itemDuration,
            layoutImage: res?.layoutImage,
            remoteFunction: true,
          });
        } else {
          navigation.goBack();
        }
      });

      break;
    case 'rmt_exit_tour':
      subScore(isScore ?? 0);
      _removeTourStarted();
      _removeTourItemDetails();
      _removeTourTargetNode();
      _removeTourPreviousNode();
      getCountLocation(0);
      handleRunTourOnFinish(itemId, tourRunID);
      setTimeout(() => {
        navigation.replace('welcome');
      }, 200);
      break;

    case 'rmt_restart_tour':
      _removeTourStarted();
      _removeTourItemDetails();
      _removeTourTargetNode();
      _removeTourPreviousNode();
      getCountLocation(0);
      subScore(isScore ?? 0);
      navigation.replace('toursingle', {
        itemId,
        itemMode,
        itemDuration,
        layoutImage,
      });
      break;
    case 'rmt_capture_screen':
      handleScreenshot(itemId, tourRunID, isFocused);
      break;
    case 'rmt_lock_screen':
      _isLockScreen(true);
      navigation.navigate('lockscreen', { itemMode: 'item' });
      break;

    default:
      break;
  }
};

export const handleRemoteMessageQuiz = async (
  remoteMessage: RemoteMessage,
  navigation: any,
  runTourData: (success: boolean) => void,
  getCountLocation: (count: number) => void,
  subScore: (score: number) => void,
  isScore: number,
  itemId: string,
  itemMode: string,
  itemDuration: null | number,
  layoutImage: object,
  tourRunID: number,
  isFocused: boolean,
) => {
  const todo = remoteMessage.data?.todo;

  switch (todo) {
    case 'rmt_next_screen':
      runTourData(true);
      break;
    case 'rmt_prev_screen':
      await _getTourPreviousNode().then(res => {
        if (res !== undefined) {
          navigation.replace(res?.type, {
            data: res?.data,
            id: res?.id,
            nodes: res?.nodes,
            edges: res?.edges,
            itemMode: res?.itemMode,
            itemId: res?.itemId,
            itemDuration: res?.itemDuration,
            layoutImage: res?.layoutImage,
            remoteFunction: true,
          });
        } else {
          navigation.goBack();
        }
      });

      break;
    case 'rmt_exit_tour':
      subScore(isScore ?? 0);
      _removeTourStarted();
      _removeTourItemDetails();
      _removeTourTargetNode();
      _removeTourPreviousNode();
      getCountLocation(0);
      handleRunTourOnFinish(itemId, tourRunID);
      setTimeout(() => {
        navigation.replace('welcome');
      }, 200);
      break;

    case 'rmt_restart_tour':
      _removeTourStarted();
      _removeTourItemDetails();
      _removeTourTargetNode();
      _removeTourPreviousNode();
      getCountLocation(0);
      subScore(isScore ?? 0);
      navigation.replace('toursingle', {
        itemId,
        itemMode,
        itemDuration,
        layoutImage,
      });
      break;
    case 'rmt_capture_screen':
      handleScreenshot(itemId, tourRunID, isFocused);
      break;
    case 'rmt_lock_screen':
      _isLockScreen(true);
      navigation.navigate('lockscreen', { itemMode: 'item' });
      break;
    default:
      break;
  }
};

const handleScreenshot = async (
  i_tour: string,
  tourRunID: number,
  isFocused: boolean,
) => {
  if (isFocused) {
    try {
      const uri = await captureScreen({
        format: 'jpg',
        quality: 0.8,
      });

      const myHeaders = new Headers();

      const token = await _retrieveData('token');

      myHeaders.append('Authorization', `Bearer ${token}`);
      myHeaders.append('Cookie', 'SERVERID=webserver4');
      const normalizedUri = uri.startsWith('file://') ? uri : `file://${uri}`;

      const formData = new FormData();
      formData.append('screenshot', {
        uri: normalizedUri,
        type: 'image/jpeg',
        name: 'screenshot.jpg',
      } as any);

      const requestOptions: RequestInit = {
        method: 'POST',
        headers: myHeaders,
        body: formData,
      };

      const response = await fetch(
        `${PROD_BASE_URL}/tours/${i_tour}/run/${tourRunID}/screenshot`,
        requestOptions,
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      Sentry.captureException(error); // <-- send to Sentry

      console.error('Screenshot upload error', error);
    }
  }
};

export const handleRunTourOnLoad = async (
  itemId: string,
  id: string,
  tourRunID: number,
  currentPosition: { latitude: any; longitude: any } | undefined,
) => {
  try {
    const token = await _retrieveData('token');
    const myHeaders = new Headers({
      Authorization: `Bearer ${token}`,
      Cookie: 'SERVERID=webserver4',
      'Content-Type': 'application/json',
    });

    const batteryLevel = await DeviceInfo.getBatteryLevel();
    const nodeID = { 'node-id': id };

    const raw = JSON.stringify({
      i_tourrun: tourRunID,
      action: 'load',
      nodeid: id,
      battery_level: Math.round(batteryLevel * 100),
      geo_lat: currentPosition?.latitude,
      geo_lng: currentPosition?.longitude,
      state: JSON.stringify(nodeID),
    });

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

    const response = await fetch(
      `${PROD_BASE_URL}/tours/${itemId}/run`,
      requestOptions,
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    // const result = await response.json();
  } catch (error) {
    Sentry.captureException(error); // <-- send to Sentry

    console.error('error', error);
  }
};

export const handleRunTourOnFinish = async (
  itemId: string,
  tourRunID: number,
) => {
  try {
    const token = await _retrieveData('token');
    const myHeaders = new Headers({
      Authorization: `Bearer ${token}`,
      Cookie: 'SERVERID=webserver4',
      'Content-Type': 'application/json',
    });

    const raw = JSON.stringify({
      i_tourrun: tourRunID,
      action: 'finished',
    });

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
    };

    const response = await fetch(
      `${PROD_BASE_URL}/tours/${itemId}/run`,
      requestOptions,
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    await response.json();
  } catch (error) {
    Sentry.captureException(error); // <-- send to Sentry

    console.error('error', error);
  }
};

export const sendPictureToServer = async (
  picture: any,
  i_tour: any,
  tourRunID: any,
) => {
  try {
    const myHeaders = new Headers();

    const token = await _retrieveData('token');

    myHeaders.append('Authorization', `Bearer ${token}`);
    myHeaders.append('Cookie', 'SERVERID=webserver4');
    myHeaders.append('Content-Type', 'multipart/form-data');

    const formData = new FormData();
    formData.append('picture', picture);
    formData.append('type', 'toolbar_picture');

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: formData,
    };

    const response = await fetch(
      `${PROD_BASE_URL}/tours/${i_tour}/run/${tourRunID}/meta`,
      requestOptions,
    );
    console.log(' ----- response ----- ', response);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  } catch (error) {
    Sentry.captureException(error); // <-- send to Sentry

    console.error('Picture upload error', error);
  }
};

export const analyzePictureByAi = async (
  picture: object,
  i_tour: any,
  tourRunID: any,
  analyseData: string,
  type: string,
): Promise<any> => {
  try {
    const myHeaders = new Headers();
    const token = await _retrieveData('token');

    myHeaders.append('Authorization', `Bearer ${token}`);
    myHeaders.append('Cookie', 'SERVERID=webserver4');
    myHeaders.append('Content-Type', 'multipart/form-data');

    const formData = new FormData();
    formData.append('picture', picture);
    formData.append('type', type);
    formData.append('analyseContains', analyseData);
    formData.append('i_tour', i_tour);
    formData.append('i_tourrun', tourRunID);
    formData.append('language', i18n?.language);

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: formData,
    };

    const response = await fetch(
      `${PROD_BASE_URL}/tours/${i_tour}/run/${tourRunID}/meta`,
      requestOptions,
    );

    if (response.ok) {
      const result = await response.json();

      return JSON?.parse(result.gpt);
    } else {
      return false;
    }
  } catch (error) {
    Sentry.captureException(error); // <-- send to Sentry

    console.error('Picture upload error', error);
    return false;
  }
};
