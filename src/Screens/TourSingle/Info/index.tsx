import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {
  _retrieveData,
  _storeTourPreviousNode,
  _storeTourTargetNode,
} from '../../../Snipets/Asyncstorage';
import { BASE_URL, COLOR, Font, PROD_BASE_URL } from '../../../Utils/variable';
import LinearGradient from 'react-native-linear-gradient';
import FullScreenImage from '../../../Snipets/FullScreenImage';
import LayoutOverlay from '../../../Components/Global/layoutOverlay';
import {
  useLocation,
  useScore,
  useTargetID,
  useTourRunID,
} from '../../../Snipets/GlobalContext';
import RNFS from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import { useCurrentPosition } from '../../../Snipets/CurrentLocation';
import TestModePopup from '../../../Snipets/TestModePopup';
import { useTranslation } from 'react-i18next';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import {
  handleRemoteMessage,
  handleRunTourOnLoad,
} from '../../../Snipets/helpers';
import { useIsFocused } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';
import { getHtmlConfig } from '../../../Utils/htmlRenderStyles';
import { playAudio } from '../../../Snipets/playAudio';
import AppStyles from '../../../Asserts/global-css/AppStyles';
import DemoIcon from '../../../Asserts/svg/DemoIcon.svg';
import * as Sentry from '@sentry/react-native';

const TourInfo = ({ navigation, route }: any) => {
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
  const currentPosition = useCurrentPosition();
  const { tourRunID } = useTourRunID();
  const scrollRef = useRef<ScrollView>(null);
  const { t } = useTranslation(['tour']);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [isReset, setIsReset] = useState<boolean>(false);
  const { isScore, subScore } = useScore();
  const { getCountLocation, getTargetLocation } = useLocation();
  const isFocused = useIsFocused();
  const [isDeactivatedLoading, setIsDeactivatedLoading] =
    useState<boolean>(true);

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
      setIsDeactivatedLoading(false);
      handleRunTourOnLoad(itemId, id, tourRunID, currentPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const runTourData = async () => {
    _storeTourPreviousNode({
      data,
      id,
      type: 'tourinfo',
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
  };

  const fetchData = async () => {
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

    const navigationMap: { [key: string]: string } = {
      videonode: 'tourvideo',
      audionode: 'touraudio',
      locationnode: 'tourmap',
      webelementnode: 'tourwebview',
      quiznode: 'tourquiz',
      infonode: 'tourinfo',
      picturenode: 'tourpicture',
      endgamenode: 'tourend',
    };

    const targetType = target?.type ?? 'tourend';

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
      navigation.replace(navigationMap[targetType], {
        data: target?.data,
        id: target?.id,
        nodes,
        edges,
        itemMode,
        itemId,
        itemDuration,
        layoutImage,
      });
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

  const fileName = data?.image_preview?.split('/').pop();
  const folderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/Images/i_tour_${itemId}`;
  const imagePath = fileName ? `${folderPath}/${fileName}` : '';
  const bannerUri = imagePath
    ? `file://${encodeURI(imagePath)}`
    : data?.image_preview;

  const backgroundImageName = layoutImage?.backgroundImage?.split('/').pop();
  const foregroundImageName = layoutImage?.foregroundImage?.split('/').pop();
  const backgroundFolderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/BackgroundImages/i_tour_${itemId}`;
  const backgroundImagePath = backgroundImageName
    ? `${backgroundFolderPath}/${backgroundImageName}`
    : null;
  const backgroundImageUri = backgroundImagePath
    ? `file://${encodeURI(backgroundImagePath)}`
    : layoutImage?.backgroundImage;
  const foregroundImagePath = foregroundImageName
    ? `${backgroundFolderPath}/${foregroundImageName}`
    : null;
  const foregroundImageUri = foregroundImagePath
    ? `file://${encodeURI(foregroundImagePath)}`
    : layoutImage?.foregroundImage;

  const { width } = useWindowDimensions();

  const htmlContent = useMemo(() => data?.info ?? '', [data?.info]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [id]);

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
        <View style={{ ...styles.fullScreen, backgroundColor: '#fff' }}>
          <ActivityIndicator size={'large'} />
        </View>
      ) : (
        <View style={styles.fullScreen}>
          {layoutImage?.backgroundImage === undefined ? (
            <LinearGradient
              colors={['#8D3EE8', '#423297']}
              style={styles.linearGradient}
            >
              <ContentScrollView
                scrollRef={scrollRef}
                layoutImage={layoutImage}
                data={data}
                imagePath={imagePath}
                foregroundImagePath={foregroundImagePath}
                runTourData={runTourData}
                isReset={isReset}
                t={t}
                width={width}
                htmlContent={htmlContent}
              />
            </LinearGradient>
          ) : (
            <ImageBackground
              source={{ uri: backgroundImageUri }}
              resizeMode="cover"
              style={styles.image}
            >
              <ContentScrollView
                scrollRef={scrollRef}
                layoutImage={layoutImage}
                data={data}
                imagePath={imagePath}
                foregroundImagePath={foregroundImagePath}
                runTourData={runTourData}
                isReset={isReset}
                t={t}
                width={width}
                htmlContent={htmlContent}
              />
            </ImageBackground>
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

interface ContentScrollViewProps {
  scrollRef: React.RefObject<ScrollView | null>;
  layoutImage: any;
  data: any;
  imagePath: string;
  foregroundImagePath: string;
  runTourData: () => void;
  isReset: boolean;
  width: number;
  htmlContent: any;
  t: (key: string) => string;
}

const ContentScrollView: React.FC<ContentScrollViewProps> = ({
  scrollRef,
  layoutImage,
  data,
  imagePath,
  foregroundImagePath,
  runTourData,
  isReset,
  width,
  htmlContent,
  t,
}) => (
  <ScrollView contentContainerStyle={styles.scrollViewContent} ref={scrollRef}>
    <View style={styles.scrollViewInner}>
      <View style={styles.containerOuter}>
        <ImageBackground
          source={foregroundImageUri ? { uri: foregroundImageUri } : undefined}
          resizeMode="stretch"
          style={styles.imageBottom}
        >
          <View
            style={{
              ...styles.container,
              backgroundColor:
                layoutImage?.foregroundImage === undefined ||
                layoutImage?.foregroundImage === ''
                  ? '#F4F4FC'
                  : 'transparent',
              paddingTop: layoutImage?.imagePadding ? 40 : 0,
              paddingHorizontal: layoutImage?.imagePadding ? 36 : 0,
            }}
          >
              {data?.image_preview && (
                <FullScreenImage
                  imageFull={data?.image ?? data?.image_preview}
                  imageUri={bannerUri}
                />
              )}
            <View
              style={{
                ...styles.container,
                backgroundColor:
                  layoutImage?.foregroundImage === undefined ||
                  layoutImage?.foregroundImage === ''
                    ? '#F4F4FC'
                    : 'transparent',
                paddingHorizontal: !layoutImage?.imagePadding ? 36 : 0,
                paddingTop:
                  data?.image_preview && !layoutImage?.imagePadding ? 0 : 40,
              }}
            >
              {!!data?.title && (
                <Text
                  style={{
                    ...styles.title,
                    color: layoutImage?.foregroundTextColor,
                  }}
                >
                  {data?.title ?? ''}
                </Text>
              )}

              <RenderHtml
                contentWidth={width}
                source={{ html: htmlContent }}
                {...getHtmlConfig(20, 30, layoutImage?.foregroundTextColor)}
              />
              <TouchableOpacity
                style={{
                  ...styles.submitBtn,
                  backgroundColor: layoutImage?.foregroundBtnColor ?? '#A659FE',
                }}
                onPress={runTourData}
                disabled={!isReset}
              >
                {isReset ? (
                  <Text
                    style={{
                      ...styles.submitBtnText,
                      color: layoutImage?.foregroundBtnTextColor ?? '#fff',
                    }}
                  >
                    {t('tour:further')}
                  </Text>
                ) : (
                  <ActivityIndicator
                    style={{ margin: 3 }}
                    color={layoutImage?.foregroundBtnTextColor ?? '#fff'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1A',
  },
  image: {
    width: '100%',
    justifyContent: 'center',
    flex: 1,
  },
  linearGradient: {
    flex: 1,
    width: '100%',
  },
  imageBottom: {
    flex: 1,
    width: '100%',
  },
  container: {
    alignItems: 'center',
    width: '100%',
    borderRadius: 20,
    paddingBottom: 36,
  },
  containerOuter: {
    width: '90%',
    maxWidth: 800,
    marginHorizontal: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Font.HelveticaBold,
  },
  para: {
    fontSize: 20,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 30,
    color: COLOR.Primary,
    fontFamily: Font.Helvetica,
  },
  submitBtnText: {
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
    fontFamily: Font.HelveticaBold,
  },
  submitBtn: {
    borderRadius: 33,
    width: '100%',
    height: 50,
    justifyContent: 'center',
  },
  testModeText: {
    textAlign: 'center',
    padding: 5,
    backgroundColor: COLOR.Blue,
    fontWeight: '700',
    color: COLOR.White,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
});

export default TourInfo;
