import { useEffect, useRef, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  View,
  ActivityIndicator,
} from 'react-native';
import Sound from 'react-native-sound';
import {
  useLocation,
  useScore,
  useTargetID,
  useTourRunID,
} from '../../../Snipets/GlobalContext';
import {
  _retrieveData,
  _storeTourPreviousNode,
  _storeTourTargetNode,
} from '../../../Snipets/Asyncstorage';
import DeviceInfo from 'react-native-device-info';
import { BASE_URL, PROD_BASE_URL } from '../../../Utils/variable';
import { useCurrentPosition } from '../../../Snipets/CurrentLocation';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import {
  handleRemoteMessage,
  handleRunTourOnLoad,
} from '../../../Snipets/helpers';
import { useIsFocused } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';

const requestAudioPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Audio Permission',
          message:
            'This app needs access to your microphone to play audio files',
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
  } else {
    return true; // iOS permissions are handled in the app's Info.plist
  }
};

const PlayAudio = ({ navigation, route }: any) => {
  const {
    data,
    id,
    nodes,
    edges,
    itemMode,
    itemId,
    itemDuration,
    layoutImage,
  } = route.params;
  const { getTargetID, targetID } = useTargetID();
  const { isScore } = useScore();
  const currentPosition = useCurrentPosition();
  const { tourRunID } = useTourRunID();
  const { subScore } = useScore();
  const { getCountLocation, getTargetLocation } = useLocation();

  const source = edges.find((edge: any) => edge.source === id);
  const target = nodes.find((node: any) => node.id === source?.target);
  const isFocused = useIsFocused();

  const soundRef = useRef<Sound | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const messagingInstance = getMessaging();

    const unsubscribeOnMessage = onMessage(messagingInstance, remoteMessage =>
      handleRemoteMessage(
        remoteMessage,
        navigation,
        runTourData,
        getCountLocation,
        subScore,
        isScore,
        itemId,
        itemMode,
        itemDuration,
        layoutImage,
        tourRunID,
        isFocused,
      ),
    );

    return () => {
      unsubscribeOnMessage();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data?.isDeactivated === true) {
      fetchData();
    } else if (typeof data?.isDeactivated === 'string') {
      if (new Date() < new Date(data.isDeactivated)) {
        fetchData();
      }
    } else if (data) {
      handleRunTourOnLoad(itemId, id, tourRunID, currentPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const runTourData = async () => {
    _storeTourPreviousNode({
      data,
      id,
      type: 'touraudio',
      nodes,
      edges,
      itemMode,
      itemId,
      itemDuration,
      layoutImage,
      targetID,
    });
    if (
      tourRunID !== null &&
      id !== null &&
      isScore !== null &&
      currentPosition?.latitude !== null &&
      currentPosition?.longitude !== null
    ) {
      try {
        const batteryLevel = await DeviceInfo.getBatteryLevel();
        const token = await _retrieveData('token');
        const myHeaders = new Headers({
          Authorization: `Bearer ${token}`,
          Cookie: 'SERVERID=webserver4',
          'Content-Type': 'application/json',
        });

        const nodeID = { 'node-id': id };

        const raw = JSON.stringify({
          i_tourrun: tourRunID,
          score: isScore,
          battery_level: Math.round(batteryLevel * 100),
          geo_lat: currentPosition?.latitude,
          geo_lng: currentPosition?.longitude,
          action: 'leave',
          nodeid: id,
          state: JSON.stringify(nodeID),
        });

        const requestOptions: RequestInit = {
          method: 'POST',
          headers: myHeaders,
          body: raw,
        };

        const response = await fetch(
          `${itemMode ? BASE_URL : PROD_BASE_URL}/tours/${itemId}/run`,
          requestOptions,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // const result = await response.json();
        // getTourRunID(result?.result?.i_tourrun);
        fetchData();
      } catch (error) {
        console.error('error', error);
        Sentry.captureException(error); // <-- send to Sentry
      }
    }
  };

  const fetchData = () => {
    _storeTourTargetNode({
      data: target?.data,
      id: target?.id,
      type: target?.type,
      nodes,
      edges,
      itemMode,
      itemId,
      itemDuration,
      layoutImage,
      targetID: target?.id,
    });
    getTargetLocation('');

    getTargetID(source?.target);
    const navigationMap = {
      videonode: 'tourvideo',
      audionode: 'touraudio',
      locationnode: 'tourmap',
      webelementnode: 'tourwebview',
      quiznode: 'tourquiz',
      infonode: 'tourinfo',
      endgamenode: 'tourend',
    };

    navigation.replace(
      navigationMap[target?.type as keyof typeof navigationMap] || 'tourend',
      {
        data: target?.data,
        id: target?.id,
        nodes,
        edges,
        itemMode,
        itemId,
        itemDuration,
        layoutImage,
      },
    );
  };

  useEffect(() => {
    if (!data?.url) {
      setIsLoading(false);
      return;
    }

    // Enable playback in silence mode
    Sound.setCategory('Playback');

    // Load from network URL (empty string as second parameter for URLs)
    soundRef.current = new Sound(data.url, '', error => {
      if (error) {
        console.log('Failed to load the sound', error);
        Sentry.captureException(error);
        setIsLoading(false);
        runTourData(); // Move to next node on error
        return;
      }

      setIsLoading(false);
      console.log('Sound loaded, duration:', soundRef.current?.getDuration());

      // Play the sound
      soundRef.current?.play(success => {
        if (success) {
          console.log('Successfully finished playing');
        } else {
          console.log('Playback failed due to audio decoding errors');
        }
        // Move to next node after playback completes
        runTourData();
      });
    });

    return () => {
      // Cleanup: stop and release sound resources
      if (soundRef.current) {
        soundRef.current.stop(() => {
          soundRef.current?.release();
          soundRef.current = null;
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.url]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
    </View>
  );
};

export default PlayAudio;
