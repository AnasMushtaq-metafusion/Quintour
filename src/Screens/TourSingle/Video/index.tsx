import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { BASE_URL, PROD_BASE_URL } from '../../../Utils/variable';
import RNFS from 'react-native-fs';
import LayoutOverlay from '../../../Components/Global/layoutOverlay';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import {
  useLocation,
  useScore,
  useTargetID,
  useTourRunID,
} from '../../../Snipets/GlobalContext';
import {
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';
import {
  _retrieveData,
  _storeTourPreviousNode,
  _storeTourTargetNode,
} from '../../../Snipets/Asyncstorage';
import DeviceInfo from 'react-native-device-info';
import { useCurrentPosition } from '../../../Snipets/CurrentLocation';
import { useTranslation } from 'react-i18next';
import TestModePopup from '../../../Snipets/TestModePopup';
import {
  handleRemoteMessage,
  handleRunTourOnLoad,
} from '../../../Snipets/helpers';
import { useIsFocused } from '@react-navigation/native';
import { playAudio } from '../../../Snipets/playAudio';
import AppStyles from '../../../Asserts/global-css/AppStyles';
import DemoIcon from '../../../Asserts/svg/DemoIcon.svg';
import * as Sentry from '@sentry/react-native';

const useStoragePermission = () => {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const requestStoragePermission = async () => {
      if (Platform.OS === 'android') {
        const permission = PERMISSIONS.ANDROID.READ_MEDIA_VIDEO;
        try {
          const result = await request(permission);
          setHasPermission(result === RESULTS.GRANTED);
          if (result !== RESULTS.GRANTED) {
            Alert.alert(
              'Permission Required',
              'Storage permission is required to play videos. Please enable it in the app settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => openSettings() },
              ],
            );
          }
        } catch (err) {
          console.warn(err);
        }
      } else {
        setHasPermission(true); // Permissions are automatically granted on iOS
      }
    };

    requestStoragePermission();
  }, []);

  return hasPermission;
};

const ProgressBar = ({ currentTime, duration }: any) => (
  <View style={styles.progress}>
    <LinearGradient
      colors={['#5BAF98', '#A7D3C7', '#5BAF98']}
      style={{
        width: `${currentTime ? ((currentTime * 1.03) / duration) * 100 : 0}%`,
        height: '100%',
      }}
    />
  </View>
);

const VideoControls = ({ paused, handlePlayPause }: any) => (
  <View style={styles.pause}>
    <TouchableOpacity onPress={handlePlayPause}>
      <Image
        source={
          paused
            ? require('../../../Asserts/play-icon.png')
            : require('../../../Asserts/pause-icon.png')
        }
        style={{ width: 30, height: 30 }}
      />
    </TouchableOpacity>
  </View>
);

const TourVideoScreen = ({ navigation, route }: any) => {
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
  const { t } = useTranslation(['tour']);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [paused, setPaused] = useState(false);
  const source = edges.find((edge: any) => edge.source === id);
  const target = nodes.find((node: any) => node.id === source?.target);
  const { getTargetID, targetID } = useTargetID();
  const { isScore, subScore } = useScore();
  const currentPosition = useCurrentPosition();
  const { getCountLocation, getTargetLocation } = useLocation();
  const { tourRunID } = useTourRunID();
  const [testMode, setTestMode] = useState<boolean>(false);
  const hasPermission = useStoragePermission();
  const isFocused = useIsFocused();
  const [isDeactivatedLoading, setIsDeactivatedLoading] =
    useState<boolean>(true);

  const onLoad = (data: any) => {
    setDuration(Math.floor(data.duration));
  };

  const onProgress = (progress: any) => {
    const newCurrentTime = Math.floor(progress.currentTime);
    if (currentTime !== newCurrentTime) {
      setCurrentTime(newCurrentTime);
    }
  };

  const handlePlayPause = () => {
    setPaused(!paused);
  };

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
      onEnd();
    } else if (typeof data?.isDeactivated === 'string') {
      if (new Date() < new Date(data.isDeactivated)) {
        onEnd();
      }
    } else if (data) {
      setIsDeactivatedLoading(false);
      handleRunTourOnLoad(itemId, id, tourRunID, currentPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const runTourData = async () => {
    _storeTourPreviousNode({
      data: data,
      id: id,
      type: 'tourvideo',
      nodes: nodes,
      edges: edges,
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
        const myHeaders = new Headers();
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('Cookie', 'SERVERID=webserver4');
        myHeaders.append('Content-Type', 'application/json');

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
        onEnd();
      } catch (error) {
        console.error('error', error);
        Sentry.captureException(error); // <-- send to Sentry
      }
    }
  };

  const onEnd = async () => {
    setIsDeactivatedLoading(true);

    getTargetID(source?.target);
    getTargetLocation('');

    _storeTourTargetNode({
      data: target?.data,
      id: target?.id,
      type: target?.type,
      nodes: nodes,
      edges: edges,
      itemMode: itemMode,
      itemId: itemId,
      itemDuration: itemDuration,
      layoutImage,
      targetID: target?.id,
    });

    const navigateToTarget = (type: string) => {
      navigation.replace(type, {
        data: target?.data,
        id: target?.id,
        nodes: nodes,
        edges: edges,
        itemMode: itemMode,
        itemId: itemId,
        itemDuration: itemDuration,
        layoutImage,
      });
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
      switch (target?.type) {
        case 'videonode':
          navigateToTarget('tourvideo');
          break;
        case 'locationnode':
          navigateToTarget('tourmap');
          break;
        case 'webelementnode':
          navigateToTarget('tourwebview');
          break;
        case 'quiznode':
          navigateToTarget('tourquiz');
          break;
        case 'infonode':
          navigateToTarget('tourinfo');
          break;
        case 'picturenode':
          navigateToTarget('tourpicture');
          break;
        case 'endgamenode':
          navigation.replace('tourend', {
            itemMode: itemMode,
            itemId,
            layoutImage,
            itemDuration,
            data: target?.data,
          });
          break;
        default:
          navigation.replace('tourend', {
            itemMode: itemMode,
            itemId,
            layoutImage,
            itemDuration,
            data: target?.data,
          });
          break;
      }
    }

    setDuration(0);
    setCurrentTime(0);
  };

  const handleEndTour = () => {
    navigation.replace('tourend', {
      itemMode: itemMode,
      itemId,
      layoutImage,
      itemDuration,
      data: target?.data,
    });
  };

  if (targetID !== id) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const fileName = data?.url?.split('/').pop();
  const folderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/Videos/i_tour_${itemId}`;
  const videopath = folderPath ? `${folderPath}/${fileName}` : data?.url;

  return (
    <LayoutOverlay
      layoutImage={layoutImage}
      data={data}
      itemDuration={itemDuration}
      itemMode={itemMode}
      setTestMode={setTestMode}
      itemId={itemId}
      handleEndTour={handleEndTour}
    >
      {itemMode && (
        <View style={AppStyles.demoView}>
          <DemoIcon />
        </View>
      )}
      {isDeactivatedLoading ? (
        <View style={{ ...styles.container, backgroundColor: '#fff' }}>
          <ActivityIndicator size={'large'} />
        </View>
      ) : (
        <View style={styles.container}>
          <ProgressBar currentTime={currentTime} duration={duration} />
          <VideoControls paused={paused} handlePlayPause={handlePlayPause} />
          {hasPermission ? (
            <Video
              source={{ uri: `${videopath}` }}
              style={styles.video}
              resizeMode="cover"
              paused={paused}
              onEnd={runTourData}
              onLoad={onLoad}
              onProgress={onProgress}
            />
          ) : (
            <View>
              <Text>{t('tour:no_video_found')}</Text>
              <TouchableOpacity onPress={() => runTourData()}>
                <Text style={styles.button}>{t('tour:next_step')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {testMode && (
        <TestModePopup
          onClick={() => setTestMode(!testMode)}
          handleNextScreen={() => runTourData()}
          handleLastScreen={() =>
            navigation.replace('tourend', {
              itemMode,
              itemId,
              layoutImage,
              itemDuration,
              data: target?.data,
            })
          }
          handleSuccess={() => runTourData()}
          handleFailure={() => runTourData()}
        />
      )}
    </LayoutOverlay>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  button: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 20,
    color: '#fff',
  },
  progress: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 5,
    zIndex: 1,
  },
  pause: {
    position: 'absolute',
    top: 15,
    right: 10,
    zIndex: 1,
  },
});

export default TourVideoScreen;
