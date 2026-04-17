import Sound from 'react-native-sound';

import { _storeTourPreviousNode, _storeTourTargetNode } from './Asyncstorage';

import { handleRunTourOnLoad } from './helpers';

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
  const sound = new Sound(data?.url, '', error => {
    if (error) {
      console.log('Failed to load the sound', error);
      fetchData();
      return;
    }

    sound.play(success => {
      if (!success) {
        console.log('Playback failed');
      }
      sound.release();
      fetchData();
    });
  });
};
