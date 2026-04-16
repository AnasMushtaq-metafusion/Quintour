import { PermissionsAndroid, Platform } from 'react-native';
import Sound from 'react-native-sound';
import DeviceInfo from 'react-native-device-info';

import {
  _retrieveData,
  _storeTourPreviousNode,
  _storeTourTargetNode,
} from './Asyncstorage';

import { handleRunTourOnLoad } from './helpers';

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
  }
  return true;
};

export const playAudio = async ({
  navigation,
  data,
  id,
  nodes,
  edges,
  itemMode,
  itemId,
  itemDuration,
  layoutImage,
  targetID,
  isScore,
  currentPosition,
  tourRunID,
  getTargetID,
  getTargetLocation,
}: any) => {
  const source = edges.find((edge: any) => edge.source === id);
  const target = nodes.find((node: any) => node.id === source?.target);

  const fetchData = async () => {
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

    const navigationMap: Record<string, string> = {
      videonode: 'tourvideo',
      audionode: 'touraudio',
      locationnode: 'tourmap',
      webelementnode: 'tourwebview',
      quiznode: 'tourquiz',
      infonode: 'tourinfo',
      endgamenode: 'tourend',
    };
    if (target?.type === 'audionode') {
      await playAudio({
        navigation,
        data: target?.data,
        id: target?.id,
        nodes,
        edges,
        itemMode,
        itemId,
        itemDuration,
        layoutImage,
        targetID,
        isScore,
        currentPosition,
        tourRunID,
        getTargetID,
        getTargetLocation,
      });
    } else {
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
    }
  };

  // Handle expiration logic
  if (data?.isDeactivated === true) {
    fetchData();
  } else if (typeof data?.isDeactivated === 'string') {
    if (new Date() < new Date(data.isDeactivated)) {
      fetchData();
    }
  } else if (data) {
    handleRunTourOnLoad(itemId, id, tourRunID, currentPosition);
  }

  // Play audio
  const hasPermission = await requestAudioPermission();
  if (hasPermission) {
    const sound = new Sound(
      data?.url,
      '', // use empty string instead of null
      error => {
        if (error) {
          console.log('Failed to load the sound', error);
          return;
        }

        // Start playing the audio
        sound.play(success => {
          if (success) {
            console.log('Playback finished successfully');
          } else {
            console.log('Playback failed');
          }
          sound.release();
        });

        fetchData();

        // Call your function immediately after starting the audio
      },
    );
  }
};
