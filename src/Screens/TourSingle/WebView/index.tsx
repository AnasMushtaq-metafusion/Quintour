import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { BASE_URL, COLOR, PROD_BASE_URL } from '../../../Utils/variable';
import LayoutOverlay from '../../../Components/Global/layoutOverlay';
import {
  useLocation,
  useScore,
  useTargetID,
  useTourRunID,
} from '../../../Snipets/GlobalContext';

import DeviceInfo from 'react-native-device-info';
import { useCurrentPosition } from '../../../Snipets/CurrentLocation';
import TestModePopup from '../../../Snipets/TestModePopup';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import {
  handleRemoteMessage,
  handleRunTourOnLoad,
} from '../../../Snipets/helpers';
import {
  _retrieveData,
  _storeTourPreviousNode,
  _storeTourTargetNode,
} from '../../../Snipets/Asyncstorage';
import { useIsFocused } from '@react-navigation/native';
import { playAudio } from '../../../Snipets/playAudio';
import AppStyles from '../../../Asserts/global-css/AppStyles';
import DemoIcon from '../../../Asserts/svg/DemoIcon.svg';
import * as Sentry from '@sentry/react-native';

const TourWebViewScreen = ({ navigation, route }: any) => {
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
  const source = edges.find((edge: any) => edge.source === id);
  const target = nodes.find((node: any) => node.id === source?.target);
  const [count, setCount] = useState<number>(0);
  const { addScore, isScore, subScore } = useScore();
  const { getTargetID, targetID } = useTargetID();
  const { getCountLocation, getTargetLocation } = useLocation();
  const currentPosition = useCurrentPosition();
  const { tourRunID } = useTourRunID();
  const [testMode, setTestMode] = useState<boolean>(false);
  const [nextView, setNextView] = useState<string>('');
  const isFocused = useIsFocused();
  const [isDeactivatedLoading, setIsDeactivatedLoading] =
    useState<boolean>(true);
  const [isReset, setIsReset] = useState<boolean>(false);

  useEffect(() => {
    if (
      nextView === 'quintour.next' ||
      nextView === 'quintour.failed' ||
      nextView === 'quintour.success'
    ) {
      runTourData();
      if (nextView === 'quintour.success') addScore(data?.score ?? 0);
    }
  }, [nextView]);

  useEffect(() => {
    if (data?.isDeactivated === true) {
      fetchData();
    } else if (typeof data?.isDeactivated === 'string') {
      if (new Date() < new Date(data.isDeactivated)) {
        fetchData();
      }
    } else if (data) {
      setIsDeactivatedLoading(false);
      handleRunTourOnLoad(itemId, id, tourRunID, currentPosition);
    }

    if (data?.url === '') runTourData();
  }, [data]);

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
  }, []);

  useEffect(() => {
    if (data?.timer && targetID === id) {
      const interval = setInterval(() => {
        setCount(prevCount => {
          if (prevCount >= data?.timer) {
            setNextView('quintour.next');
            return prevCount;
          }
          return prevCount + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const runTourData = async () => {
    if (data?.url !== '') {
      setNextView('');
      _storeTourPreviousNode({
        data,
        id,
        type: 'tourwebview',
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
          setIsReset(false);

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
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          // const result = await response.json();

          // getTourRunID(result?.result?.i_tourrun);
          fetchData();
        } catch (error) {
          console.error('error', error);
          Sentry.captureException(error); // <-- send to Sentry
        }
      }
    } else {
      fetchData();
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
    setIsDeactivatedLoading(true);

    getTargetLocation('');

    getTargetID(source?.target);
    navigateToTarget(target?.type);
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

  const navigateToTarget = async (type: string) => {
    const navigationParams = {
      data: target?.data,
      id: target?.id,
      nodes,
      edges,
      itemMode,
      itemId,
      itemDuration,
      layoutImage,
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
      switch (type) {
        case 'videonode':
          navigation.replace('tourvideo', navigationParams);
          break;
        case 'locationnode':
          navigation.replace('tourmap', navigationParams);
          break;
        case 'webelementnode':
          navigation.replace('tourwebview', navigationParams);
          break;
        case 'quiznode':
          navigation.replace('tourquiz', navigationParams);
          break;
        case 'infonode':
          navigation.replace('tourinfo', navigationParams);
          break;
        case 'picturenode':
          navigation.replace('tourpicture', navigationParams);
          break;
        case 'endgamenode':
          navigation.replace('tourend', {
            itemMode,
            itemId,
            layoutImage,
            itemDuration,
            data: target?.data,
          });
          break;
        default:
          navigation.replace('tourend', {
            itemMode,
            itemId,
            layoutImage,
            itemDuration,
            data: target?.data,
          });
          break;
      }
    }
  };

  return (
    <LayoutOverlay
      layoutImage={layoutImage}
      data={data}
      itemDuration={itemDuration}
      itemMode={itemMode}
      setTestMode={setTestMode}
      setIsReset={setIsReset}
      isReset={isReset}
      handleEndTour={handleEndTour}
    >
      {itemMode && (
        <View style={AppStyles.demoView}>
          <DemoIcon />
        </View>
      )}
      {isDeactivatedLoading ? (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <ActivityIndicator size={'large'} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {data?.timer !== null && data?.timer > 0 && (
            <TouchableOpacity onPress={runTourData}>
              <Text style={styles.button}>
                Close webview and move next step | {data?.timer - count}
              </Text>
            </TouchableOpacity>
          )}
          {data?.url ? (
            <WebView
              source={{ uri: data?.url }}
              style={{ flex: 1 }}
              startInLoadingState={true}
              renderLoading={Spinner}
              onMessage={event => setNextView(event.nativeEvent.data ?? '')}
            />
          ) : (
            <View>
              <Text>No url found</Text>
            </View>
          )}
        </View>
      )}
      {testMode && (
        <TestModePopup
          onClick={() => setTestMode(!testMode)}
          handleNextScreen={runTourData}
          handleLastScreen={() =>
            navigation.replace('tourend', {
              itemMode,
              itemId,
              layoutImage,
              itemDuration,
              data: target?.data,
            })
          }
          handleSuccess={runTourData}
          handleFailure={runTourData}
        />
      )}
    </LayoutOverlay>
  );
};

const Spinner = () => (
  <View style={styles.spinner}>
    <ActivityIndicator size="large" />
  </View>
);

export default TourWebViewScreen;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 20,
    color: '#fff',
  },
  testModeText: {
    textAlign: 'center',
    padding: 5,
    backgroundColor: COLOR.Blue,
    fontWeight: '700',
    color: COLOR.White,
  },
  spinner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    top: 0,
    left: 0,
    position: 'absolute',
  },
});
