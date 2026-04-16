import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { BASE_URL, COLOR, PROD_BASE_URL } from '../../../Utils/variable';
import LayoutOverlay from '../../../Components/Global/layoutOverlay';
import {
  useGlobal,
  useLocation,
  useScore,
  useTargetID,
  useTourRunID,
} from '../../../Snipets/GlobalContext';
import { Image } from 'react-native-compressor';

import DeviceInfo from 'react-native-device-info';
import { useCurrentPosition } from '../../../Snipets/CurrentLocation';
import TestModePopup from '../../../Snipets/TestModePopup';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import {
  analyzePictureByAi,
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
import PictureDataPopup from '../../../Snipets/PictureDataPopup';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import PictureTextPopup from '../../../Snipets/PictureTextPopup';
import PictureConfirmationPopup from '../../../Snipets/PictureConfirmationPopup';
import * as Sentry from '@sentry/react-native';

const TourPictureScreen = ({ navigation, route }: any) => {
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
  const { isScore, subScore } = useScore();
  const { getTargetID, targetID } = useTargetID();
  const { getCountLocation, getTargetLocation } = useLocation();
  const currentPosition = useCurrentPosition();
  const { tourRunID } = useTourRunID();
  const [testMode, setTestMode] = useState<boolean>(false);
  const isFocused = useIsFocused();
  const [isDeactivatedLoading, setIsDeactivatedLoading] =
    useState<boolean>(true);
  const [isReset, setIsReset] = useState<boolean>(false);
  const [picturePopup, setPicturePopup] = useState<boolean>(true);
  const [pictureTextPopup, setPictureTextPopup] = useState<boolean>(false);
  const [pictureConfirmationPopup, setPictureConfirmationPopup] =
    useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<any>('');
  const [infoText, setInfoText] = useState('');

  const { setAnalyzePicturesArray, showToolbar } = useGlobal();

  const [image, setImage] = useState<object>({});
  const [isLoading, setIsLoading] = useState(false);

  const cameraRef = useRef<Camera | null>(null);
  const device = useCameraDevice('back');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runTourData = async () => {
    if (data?.url !== '') {
      _storeTourPreviousNode({
        data,
        id,
        type: 'tourpicture',
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
  const handleEndTour = () => {
    navigation.replace('tourend', {
      itemMode: itemMode,
      itemId,
      layoutImage,
      itemDuration,
      data: target?.data,
    });
  };
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto();

        const localUri = 'file://' + photo.path; // VisionCamera gives relative path
        const filename = localUri.split('/').pop();
        const match = filename ? /\.(\w+)$/.exec(filename) : null;
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const compressedUri = await Image.compress(localUri, {
          compressionMethod: 'auto',
          quality: 0.1,
        });

        const compressedFile = {
          uri: compressedUri,
          name: filename ?? 'photo.jpg',
          type,
        };
        setImage(compressedFile);

        const file = {
          uri: localUri,
          name: filename ?? 'photo.jpg',
          type,
        };

        setAnalyzePicturesArray((prevArray: any[]) => [
          ...prevArray,
          {
            picture: file,
            analyseData: data?.ai_tag,
            i_tour: itemId,
            tourRunID,
          },
        ]);

        setPictureTextPopup(!pictureTextPopup);
        setPictureConfirmationPopup(!pictureConfirmationPopup);
      } catch (err) {
        console.warn('Error taking picture:', err);
      }
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    const result = await analyzePictureByAi(
      image,
      itemId,
      tourRunID,
      data?.ai_tag,
      'node_picture_small',
    );
    if (result) {
      setIsLoading(false);
      setIsSuccess(result?.contains);
      setInfoText(result?.info);
    } else {
      setIsLoading(false);

      setIsSuccess(true);
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
      itemId={itemId}
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
          {device != null && (
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              photo={true}
            />
          )}

          <View style={styles.overlay}>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture} />
          </View>
        </View>
      )}
      {picturePopup && (
        <PictureDataPopup
          onClick={() => {
            setPicturePopup(!picturePopup);
            setPictureTextPopup(!pictureTextPopup);
          }}
          data={data}
        />
      )}
      {pictureTextPopup && !showToolbar && <PictureTextPopup data={data} />}
      {pictureConfirmationPopup && (
        <PictureConfirmationPopup
          onClick={handleConfirm}
          onCancel={() => {
            setInfoText('');
            setIsSuccess('');
            setPictureConfirmationPopup(!pictureConfirmationPopup);
            setPictureTextPopup(!pictureTextPopup);
            setAnalyzePicturesArray([]);
          }}
          isSuccess={isSuccess}
          isLoading={isLoading}
          runTourData={runTourData}
          image={image}
          infoText={infoText}
        />
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

export default TourPictureScreen;

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

  overlay: {
    position: 'absolute',
    right: 50,
    top: '50%',
    transform: [{ translateY: -35 }], // half of button height
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
