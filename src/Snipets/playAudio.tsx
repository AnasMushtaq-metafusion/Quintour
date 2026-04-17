import DeviceInfo from 'react-native-device-info';
import * as Sentry from '@sentry/react-native';

import { BASE_URL, PROD_BASE_URL } from '../Utils/variable';
import {
  _retrieveData,
  _storeTourPreviousNode,
  _storeTourTargetNode,
} from './Asyncstorage';
import { AudioManager } from '../Services/Audio/AudioManager';
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
  const navigationMap: Record<string, string> = {
    videonode: 'tourvideo',
    audionode: 'touraudio',
    locationnode: 'tourmap',
    webelementnode: 'tourwebview',
    quiznode: 'tourquiz',
    infonode: 'tourinfo',
    picturenode: 'tourpicture',
    endgamenode: 'tourend',
  };

  const getNextNode = (nodeId: any) => {
    const edge = edges.find((e: any) => e.source === nodeId);
    if (!edge) return null;
    return nodes.find((n: any) => n.id === edge.target) ?? null;
  };

  const shouldSkipNode = (nodeData: any) => {
    if (nodeData?.isDeactivated === true) return true;
    if (typeof nodeData?.isDeactivated === 'string') {
      return new Date() < new Date(nodeData.isDeactivated);
    }
    return false;
  };

  const sendLeaveAction = async (nodeId: any) => {
    if (
      tourRunID === null ||
      tourRunID === undefined ||
      nodeId === null ||
      nodeId === undefined ||
      isScore === null ||
      isScore === undefined ||
      currentPosition?.latitude === null ||
      currentPosition?.latitude === undefined ||
      currentPosition?.longitude === null ||
      currentPosition?.longitude === undefined
    ) {
      return;
    }

    try {
      const batteryLevel = await DeviceInfo.getBatteryLevel();
      const token = await _retrieveData('token');
      const myHeaders = new Headers({
        Authorization: `Bearer ${token}`,
        Cookie: 'SERVERID=webserver4',
        'Content-Type': 'application/json',
      });

      const nodeID = { 'node-id': nodeId };

      const raw = JSON.stringify({
        i_tourrun: tourRunID,
        score: isScore,
        battery_level: Math.round(batteryLevel * 100),
        geo_lat: currentPosition?.latitude,
        geo_lng: currentPosition?.longitude,
        action: 'leave',
        nodeid: nodeId,
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
    } catch (error) {
      console.error('audio leave error', error);
      Sentry.captureException(error);
    }
  };

  const audioStartNode = nodes.find((n: any) => n.id === id) ?? {
    id,
    type: 'audionode',
    data,
  };

  // Collect consecutive audio nodes so we don't overlap voiceovers.
  const audioChain: any[] = [];
  let cursor: any = audioStartNode;
  while (cursor && cursor.type === 'audionode') {
    audioChain.push(cursor);
    cursor = getNextNode(cursor.id);
  }

  const finalTarget = cursor; // first non-audio node (or null)

  // Persist tour pointers immediately to keep navigation consistent.
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

  if (finalTarget) {
    _storeTourTargetNode({
      data: finalTarget?.data,
      id: finalTarget?.id,
      type: finalTarget?.type,
      nodes,
      edges,
      itemMode,
      itemId,
      itemDuration,
      layoutImage,
      targetID: finalTarget?.id,
    });
  }

  getTargetLocation?.('');
  getTargetID?.(finalTarget?.id);

  // Start audio in background (keeps playing even when screens change).
  if (!shouldSkipNode(data) && data?.url) {
    handleRunTourOnLoad(itemId, id, tourRunID, currentPosition);

    const queueItems = audioChain
      .filter(n => !shouldSkipNode(n?.data) && n?.data?.url)
      .map(n => ({
        url: n.data.url,
        onEnd: async () => {
          await sendLeaveAction(n.id);
        },
        onError: async (error: unknown) => {
          console.error('audio load/play error', error);
          Sentry.captureException(error);
          await sendLeaveAction(n.id);
        },
      }));

    if (queueItems.length > 0) {
      // Fire-and-forget; navigation continues immediately.
      AudioManager.playQueue(queueItems);
    }
  }

  // Navigate immediately to the next non-audio node.
  if (!finalTarget) {
    navigation.replace('tourend', {
      itemMode,
      itemId,
      layoutImage,
      itemDuration,
      data: null,
    });
    return;
  }

  const nextRoute =
    navigationMap[finalTarget?.type as keyof typeof navigationMap] || 'tourend';

  if (nextRoute === 'tourend') {
    navigation.replace('tourend', {
      itemMode,
      itemId,
      layoutImage,
      itemDuration,
      data: finalTarget?.data,
    });
    return;
  }

  navigation.replace(nextRoute, {
    data: finalTarget?.data,
    id: finalTarget?.id,
    nodes,
    edges,
    itemMode,
    itemId,
    itemDuration,
    layoutImage,
  });
};
