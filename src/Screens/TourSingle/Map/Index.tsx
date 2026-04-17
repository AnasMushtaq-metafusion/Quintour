import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  MapView,
  MarkerView,
  ShapeSource,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import Geolocation from 'react-native-geolocation-service';
import { BASE_URL, Font, PROD_BASE_URL } from '../../../Utils/variable';
import RNFS from 'react-native-fs';
import LayoutOverlay from '../../../Components/Global/layoutOverlay';
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
import { useCurrentPosition } from '../../../Snipets/CurrentLocation';
import { useTranslation } from 'react-i18next';
import TestModePopup from '../../../Snipets/TestModePopup';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import {
  handleRemoteMessage,
  handleRunTourOnLoad,
} from '../../../Snipets/helpers';
import { useIsFocused } from '@react-navigation/native';
import { playAudio } from '../../../Snipets/playAudio';
import AppStyles from '../../../Asserts/global-css/AppStyles';
import DemoIcon from '../../../Asserts/svg/DemoIcon.svg';
import * as Sentry from '@sentry/react-native';

interface Props {
  navigation: any;
  route: any;
}

interface Position {
  latitude: number;
  longitude: number;
}

// Adds breathing room so markers stay visible within the operator overlay area.
const CAMERA_FIT_PADDING = 120;
const CAMERA_FIT_ANIMATION_MS = 1000;
// Limits over-zoom that can hide user/target markers behind overlays.
const CAMERA_MAX_ZOOM = 17;

const TourMap: React.FC<Props> = ({ navigation, route }: any) => {
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
  const { getTargetID, targetID } = useTargetID();
  const { addScore, isScore, subScore } = useScore();
  const { addLocation, getTargetLocation, getCountLocation } = useLocation();
  const [currentDistance, setDistance] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [targetPosition, setTargetPosition] = useState<Position>({
    latitude: data?.lat,
    longitude: data?.lng,
  });
  const { tourRunID } = useTourRunID();
  const [testMode, setTestMode] = useState<boolean>(false);
  const [reached, setReached] = useState<boolean>(false);
  const currentPosition = useCurrentPosition();
  const { t } = useTranslation(['tour']);
  const isFocused = useIsFocused();
  const [isDeactivatedLoading, setIsDeactivatedLoading] =
    useState<boolean>(true);
  const [isReset, setIsReset] = useState<boolean>(false);

  const cameraRef = useRef<any>(null);
  const hasFittedCameraRef = useRef<boolean>(false);

  const watchId = useRef<number | null>(null);

  useEffect(() => {
    hasFittedCameraRef.current = false;
  }, [id]);

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
      nextStep();
    } else if (typeof data?.isDeactivated === 'string') {
      if (new Date() < new Date(data.isDeactivated)) {
        nextStep();
      }
    } else if (data) {
      setIsDeactivatedLoading(false);
      handleRunTourOnLoad(itemId, id, tourRunID, currentPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (currentPosition !== null && targetID === id) {
      checkProximityToTarget(currentPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPosition, targetID, id]);

  const checkProximityToTarget = (currentPosition: Position) => {
    const distance = getDistance(
      currentPosition.latitude,
      currentPosition.longitude,
      targetPosition.latitude,
      targetPosition.longitude,
    );
    setDistance(distance);
    const distanceInMeters = data?.range ? data?.range : 25;
    if (distance <= distanceInMeters) {
      setReached(true);
      setDistance(null);
    }
    if (distance < 75) {
      getTargetLocation('Reached');
    }
  };

  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const runTourData = async () => {
    _storeTourPreviousNode({
      data,
      id,
      type: 'tourmap',
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
        nextStep();
      } catch (error) {
        console.error('error', error);
        Sentry.captureException(error); // <-- send to Sentry
      }
    }
  };

  const nextStep = () => {
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
    addScore(data?.score ?? 0);
    addLocation(1);
    setDistance(null);
    getTargetLocation('');

    setIsDeactivatedLoading(true);
    getTargetID(source?.target);
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    navigateToTarget();
  };

  const navigateToTarget = async () => {
    const targetType = target?.type;
    const targetData = {
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
      switch (targetType) {
        case 'videonode':
          navigation.replace('tourvideo', targetData);
          break;
        case 'locationnode':
          navigation.replace('tourmap', targetData);
          break;
        case 'webelementnode':
          navigation.replace('tourwebview', targetData);
          break;
        case 'quiznode':
          navigation.replace('tourquiz', targetData);
          break;
        case 'infonode':
          navigation.replace('tourinfo', targetData);
          break;
        case 'picturenode':
          navigation.replace('tourpicture', targetData);
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

  const IamThere = () => {
    if ((data.duration !== 0 && data.duration !== null) || reached) {
      if (data?.range < 35 || data.duration < 35) {
        return (
          <TouchableOpacity
            onPress={runTourData}
            style={styles.buttonContainer}
          >
            <Text style={styles.button}>{t('tour:i_have_arrived')}</Text>
          </TouchableOpacity>
        );
      }
    }
    return null;
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

  const fileName = data?.icon?.split('/').pop();
  const iconFolderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/Images/i_tour_${itemId}`;
  const imagePath = iconFolderPath
    ? `${iconFolderPath}/${fileName}`
    : data?.icon;
  const mapOverlayImage = layoutImage?.mapOverlayImage?.split('/').pop();
  const folderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/BackgroundImages/i_tour_${itemId}`;
  const backgroundImagePath = folderPath
    ? `${folderPath}/${mapOverlayImage}`
    : layoutImage?.mapOverlayImage;
  const tokenVal = layoutImage?.mapLayout
    ? layoutImage?.mapLayout
    : `https://api.jawg.io/styles/jawg-streets.json?access-token=aDTkVS0v9FYqZKmkyR1EFFvjrwpA3waKu6A29RfRFkIDex39PO0t1puyQxBSLtH6`;

  useEffect(() => {
    if (
      currentPosition &&
      targetPosition &&
      cameraRef.current &&
      !hasFittedCameraRef.current
    ) {
      cameraRef.current?.fitBounds(
        [currentPosition?.longitude, currentPosition?.latitude],
        [targetPosition?.longitude, targetPosition?.latitude],
        CAMERA_FIT_PADDING,
        CAMERA_FIT_ANIMATION_MS,
      );
      hasFittedCameraRef.current = true;
    }
  }, [currentPosition, targetPosition]);

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

      <ImageBackground
        source={{ uri: `file://${backgroundImagePath}` }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
        resizeMode="stretch"
      />
      {isDeactivatedLoading ? (
        <View style={{ ...styles.page, backgroundColor: '#fff' }}>
          <ActivityIndicator size={'large'} />
        </View>
      ) : (
        <View style={styles.page}>
          <View style={styles.container}>
            <IamThere />
            {currentDistance && (
              <Text style={styles.distanceText}>
                {currentDistance.toFixed(1)} m
              </Text>
            )}
            <MapView
              style={styles.map}
              logoEnabled={false}
              attributionEnabled={true}
              compassEnabled={true}
              attributionPosition={{ bottom: 8, left: 8 }}
              mapStyle={tokenVal}
            >
              {currentPosition && (
                <Camera
                  ref={cameraRef}
                  centerCoordinate={[
                    currentPosition?.longitude,
                    currentPosition?.latitude,
                  ]}
                  minZoomLevel={1}
                  maxZoomLevel={CAMERA_MAX_ZOOM}
                />
              )}
              {currentPosition && (
                <>
                  <ShapeSource
                    id="route-source"
                    shape={{
                      type: 'Feature',
                      properties: {},
                      geometry: {
                        type: 'LineString',
                        coordinates: [
                          [targetPosition.longitude, targetPosition.latitude],
                          [currentPosition.longitude, currentPosition.latitude],
                        ],
                      },
                    }}
                  />
                  <UserLocation
                    showsUserHeadingIndicator={true}
                    visible={true}
                    animated={true}
                    androidRenderMode="compass"
                    renderMode="native"
                  />

                  {/* <MapLibreGL.MarkerView
                id="currentPosition"
                coordinate={[
                currentPosition.longitude,
                currentPosition.latitude,
                ]}>
                <View style={styles.dot} />
              </MapLibreGL.MarkerView> */}
                  <MarkerView
                    id="targetPosition"
                    coordinate={[
                      targetPosition.longitude ?? 0,
                      targetPosition.latitude ?? 0,
                    ]}
                  >
                    <View>
                      {data?.icon ? (
                        <Image
                          source={{ uri: `file://${imagePath}` }}
                          style={styles.markerImage}
                        />
                      ) : (
                        <Image
                          source={require('../../../Asserts/map-pin.png')}
                          style={styles.markerImage}
                        />
                      )}
                    </View>
                  </MarkerView>
                </>
              )}
            </MapView>
          </View>
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

export default TourMap;
const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
    alignSelf: 'stretch',
  },
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#423297',
    paddingHorizontal: 20,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 18,
    color: '#fff',
    borderRadius: 16,
    fontFamily: Font.Helvetica,
  },
  buttonContainer: {
    position: 'absolute',
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
    right: 0,
    bottom: 100,
  },
  markerImage: {
    width: 40,
    height: 40,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 50,
    backgroundColor: '#007ac5',
    borderColor: '#fff',
    borderWidth: 2,
  },
  distanceText: {
    fontFamily: Font.HelveticaBold,
    textAlign: 'center',
    fontSize: 24,
  },
});
