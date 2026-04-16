//import liraries
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  _getTourTargetNode,
  _retrieveData,
  _storeTourTargetNode,
} from '../../Snipets/Asyncstorage';
import { BASE_URL, COLOR, Font, PROD_BASE_URL } from '../../Utils/variable';
import LinearGradient from 'react-native-linear-gradient';
import LayoutTransparent from '../../Components/Global/layoutTransparent';
import RNFS from 'react-native-fs';
import {
  useLocation,
  useRefreshing,
  useScore,
  useTargetID,
  useTourRunID,
} from '../../Snipets/GlobalContext';
import { useTimer } from '../../Snipets/TimeContext';
import DeviceInfo from 'react-native-device-info';
import { useCurrentPosition } from '../../Snipets/CurrentLocation';
import { useTranslation } from 'react-i18next';
import { playAudio } from '../../Snipets/playAudio';
import DemoIcon from '../../Asserts/svg/DemoIcon.svg';
import AppStyles from '../../Asserts/global-css/AppStyles';
import WebView from 'react-native-webview';
import * as Sentry from '@sentry/react-native';

type TargetObject = {
  targetId: string;
};

const TourSingle = ({ navigation, route }: any) => {
  const { itemId, itemMode, itemDuration, layoutImage } = route.params;
  const [nodes, setNodes] = React.useState<any>();
  const [edges, setEdges] = React.useState<any>();
  const [loader, setLoader] = React.useState<boolean>(true);
  const [imageLoader, setImageLoader] = React.useState<boolean>(true);
  const webViewRef = useRef<WebView>(null);

  const { t } = useTranslation(['common', 'tour']);

  const { isScore } = useScore();
  const currentPosition = useCurrentPosition();
  const { tourRunID, getTourRunID } = useTourRunID();

  // const [winscore, setWinScore] = React.useState<number>(0);

  const { statTimer } = useTimer();
  const { getLocations, getTargetLocation } = useLocation();
  const { getTargetID } = useTargetID();
  const { refreshing, getRefreshing } = useRefreshing();

  const source = edges?.find((edge: any) => edge.source === '1');
  const target = nodes?.find((node: any) => node.id === source?.target);
  // console.log('duration TourSingle', itemDuration);
  // console.log('seconds', source?.target);

  useEffect(() => {
    fetchDataCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  useEffect(() => {
    if (refreshing) {
      fetchDataCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing]);

  const fetchDataCall = async () => {
    const token = await _retrieveData('token');
    const myHeaders = new Headers();
    myHeaders.append('Authorization', `Bearer ${token}`);
    myHeaders.append('Cookie', 'SERVERID=webserver4');

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
    };

    await fetch(
      `${itemMode ? BASE_URL : PROD_BASE_URL}/tours/${JSON.stringify(itemId)}`,
      requestOptions,
    )
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      })
      .then(async result => {
        const data = JSON.parse(result?.data);
        const flow = data?.flow;

        setNodes(flow?.nodes);
        setEdges(flow?.edges);

        const videoList = flow?.nodes
          .filter((node: any) => node.type === 'videonode')
          .map((item: any) => item?.data?.url);

        const imageList = flow?.nodes
          .filter(
            (node: any) => node.type === 'quiznode' || node.type === 'infonode',
          )
          .map((item: any) => item?.data?.image_preview);

        const LocationList = flow?.nodes.filter(
          (node: any) => node.type === 'locationnode',
        );

        const locationIconArray = LocationList.map(
          (item: any) => item.data.icon,
        );

        if (LocationList?.length > 0) {
          getLocations(LocationList?.length);
        } else {
          getLocations(0);
        }

        // Start loaders before download functions
        if (videoList?.length > 0) {
          setLoader(true); // Start video loader
          await downloadFile(videoList, itemId);
        }

        if (imageList?.length > 0) {
          setImageLoader(true); // Start image loader
          await downloadImageFile(imageList, itemId);
        }

        if (locationIconArray?.length > 0) {
          await downloadImageFile(locationIconArray, itemId);
        }

        setLoader(false); // Stop video loader
        setImageLoader(false); // Stop image loader

        getRefreshing(false);
        await _getTourTargetNode().then(res => {
          if (res !== undefined) {
            const targetRefreshData = flow?.nodes?.find(
              (node: any) => node.id === res?.targetID,
            );

            if (targetRefreshData) {
              res.data = targetRefreshData?.data;
            }

            runTourData(res);
          }
        });
      })
      .catch(error => {
        Alert.alert(
          t('tour:empty_tour_text'),
          '',
          [
            {
              text: t('common:ok'),
              onPress: () => {
                navigation.replace('welcome');
              },
            },
          ],
          { cancelable: false },
        );

        Sentry.captureException(error); // <-- send to Sentry

        console.log('error', error);
      });
  };

  const downloadFile = async (videoList: any, id: any) => {
    const downloadFiles = videoList ?? [];
    const folderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/Videos/i_tour_${id}`;

    try {
      await RNFS.mkdir(folderPath);
      console.log('Directory created at:', folderPath);
    } catch (error) {
      console.log('Directory could not be created:', error);
      Alert.alert('Error', 'Directory could not be created');
      setLoader(false); // Ensure loader is stopped on error

      return;
    }

    for (const fileUrl of downloadFiles) {
      const fileName = fileUrl?.split('/').pop();
      const downloadDest = `${folderPath}/${fileName}`;

      const fileExists = await RNFS.exists(downloadDest);
      if (fileExists) {
        console.log(
          `File already exists at: ${downloadDest}, skipping download.`,
        );
        continue;
      }

      const options = {
        fromUrl: fileUrl,
        toFile: downloadDest,
        background: true,
        discretionary: true,
        cacheable: true,
        begin: (res: any) => {
          console.log('Download has begun:', JSON.stringify(res));
        },
        progress: (res: { bytesWritten: number; contentLength: number }) => {
          const progressPercent = (res.bytesWritten / res.contentLength) * 100;
          const payload = {
            type: 'quintour.loading',
            progressVideosPercent: progressPercent,
          };
          webViewRef.current?.postMessage(JSON.stringify(payload));
          console.log(`Progress: ${progressPercent}%`);
        },
      };

      try {
        const result = await RNFS.downloadFile(options).promise;
        if (result.statusCode === 200) {
          console.log('File downloaded to:', downloadDest);
        } else {
          Alert.alert('Failed', 'File download failed, please restart tour');
          console.log('Error:', result);
        }
      } catch (error) {
        console.log('Download error:', error);
      }
    }
  };

  const downloadImageFile = async (imageList: any, id: any) => {
    const downloadFiles = imageList ?? [];
    const folderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/Images/i_tour_${id}`;

    try {
      await RNFS.mkdir(folderPath);
      console.log('Directory created at:', folderPath);
    } catch (error) {
      console.log('Directory could not be created:', error);
      Alert.alert('Error', 'Directory could not be created');
      setImageLoader(false); // Ensure loader is stopped on error
      return;
    }

    for (const fileUrl of downloadFiles) {
      const fileName = fileUrl?.split('/').pop();
      const downloadDest = `${folderPath}/${fileName}`;

      const fileExists = await RNFS.exists(downloadDest);
      if (fileExists) {
        console.log(
          `File already exists at: ${downloadDest}, skipping download.`,
        );
        continue;
      }

      const options = {
        fromUrl: fileUrl,
        toFile: downloadDest,
        background: true,
        discretionary: true,
        cacheable: true,
        begin: (res: any) => {
          console.log('Download has begun:', JSON.stringify(res));
        },
        progress: (res: { bytesWritten: number; contentLength: number }) => {
          const progressPercent = (res.bytesWritten / res.contentLength) * 100;
          const payload = {
            type: 'quintour.loading',
            progressImagesPercent: progressPercent,
          };
          webViewRef.current?.postMessage(JSON.stringify(payload));
          console.log(`Progress: ${progressPercent}%`);
        },
      };

      try {
        const result = await RNFS.downloadFile(options).promise;
        if (result.statusCode === 200) {
          console.log('File downloaded to:', downloadDest);
        } else {
          Alert.alert('Failed', 'File download failed, please restart tour');
          console.log('Error:', result);
        }
      } catch (error) {
        console.log('Download error:', error);
      }
    }
    setImageLoader(false); // Stop image loader
  };

  const runTourData = async (targetId: TargetObject) => {
    try {
      // Get the battery level (async call, so we need to await)
      const batteryLevel = await DeviceInfo.getBatteryLevel();

      const token = await _retrieveData('token');
      const myHeaders = new Headers();
      myHeaders.append('Authorization', `Bearer ${token}`);
      myHeaders.append('Cookie', 'SERVERID=webserver4');
      myHeaders.append('Content-Type', 'application/json');

      // Create the request payload with the exact expected structure
      const raw = JSON.stringify({
        score: isScore, // Ensure isScore is a number
        battery_level: Math.round(batteryLevel * 100), // Ensure battery level is a number
        geo_lat: currentPosition?.latitude, // Ensure latitude is a number
        geo_lng: currentPosition?.longitude, // Ensure longitude is a number
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
        throw new Error(`HTTP error! status: ${response}`);
      }

      const result = await response.json();
      getTourRunID(result?.result?.i_tourrun);

      if (targetId?.targetId === 'none') {
        fetchData();
      } else {
        fetchTourStartedData(targetId);
      }
    } catch (error) {
      console.error('error', error);
    }
  };

  const fetchData = async () => {
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

    statTimer();
    getTargetID(source?.target);
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
        targetID: target?.id,
        isScore,
        currentPosition,
        tourRunID,
        getTargetID,
        getTargetLocation,
      });
    } else {
      switch (target?.type) {
        case 'videonode':
          navigation.replace('tourvideo', {
            data: target?.data,
            id: target?.id,
            nodes: nodes,
            edges: edges,
            itemMode: itemMode,
            itemId: itemId,
            itemDuration: itemDuration,
            layoutImage,
          });
          break;
        case 'locationnode':
          navigation.replace('tourmap', {
            data: target?.data,
            id: target?.id,
            nodes: nodes,
            edges: edges,
            itemMode: itemMode,
            itemId: itemId,
            itemDuration: itemDuration,
            layoutImage,
          });
          break;
        case 'webelementnode':
          navigation.replace('tourwebview', {
            data: target?.data,
            id: target?.id,
            nodes: nodes,
            edges: edges,
            itemMode: itemMode,
            itemId: itemId,
            itemDuration: itemDuration,
            layoutImage,
          });
          break;
        case 'quiznode':
          navigation.replace('tourquiz', {
            data: target?.data,
            id: target?.id,
            nodes: nodes,
            edges: edges,
            itemMode: itemMode,
            itemId: itemId,
            itemDuration: itemDuration,
            layoutImage,
          });
          break;
        case 'infonode':
          navigation.replace('tourinfo', {
            data: target?.data,
            id: target?.id,
            nodes: nodes,
            edges: edges,
            itemMode: itemMode,
            itemId: itemId,
            itemDuration: itemDuration,
            layoutImage,
          });
          break;
        case 'picturenode':
          navigation.replace('tourpicture', {
            data: target?.data,
            id: target?.id,
            nodes: nodes,
            edges: edges,
            itemMode: itemMode,
            itemId: itemId,
            itemDuration: itemDuration,
            layoutImage,
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

  const fetchTourStartedData = async (tourTarget: any) => {
    statTimer();
    getTargetID(tourTarget?.targetID);

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
        targetID: target?.id,
        isScore,
        currentPosition,
        tourRunID,
        getTargetID,
        getTargetLocation,
      });
    } else {
      switch (tourTarget?.type) {
        case 'videonode':
          navigation.replace('tourvideo', {
            data: tourTarget?.data,
            id: tourTarget?.id,
            nodes: tourTarget?.nodes,
            edges: tourTarget?.edges,
            itemMode: tourTarget?.itemMode,
            itemId: tourTarget?.itemId,
            itemDuration: tourTarget?.itemDuration,
            layoutImage: tourTarget?.layoutImage,
          });
          break;
        case 'locationnode':
          navigation.replace('tourmap', {
            data: tourTarget?.data,
            id: tourTarget?.id,
            nodes: tourTarget?.nodes,
            edges: tourTarget?.edges,
            itemMode: tourTarget?.itemMode,
            itemId: tourTarget?.itemId,
            itemDuration: tourTarget?.itemDuration,
            layoutImage: tourTarget?.layoutImage,
          });
          break;
        case 'webelementnode':
          navigation.replace('tourwebview', {
            data: tourTarget?.data,
            id: tourTarget?.id,
            nodes: tourTarget?.nodes,
            edges: tourTarget?.edges,
            itemMode: tourTarget?.itemMode,
            itemId: tourTarget?.itemId,
            itemDuration: tourTarget?.itemDuration,
            layoutImage: tourTarget?.layoutImage,
          });
          break;
        case 'quiznode':
          navigation.replace('tourquiz', {
            data: tourTarget?.data,
            id: tourTarget?.id,
            nodes: tourTarget?.nodes,
            edges: tourTarget?.edges,
            itemMode: tourTarget?.itemMode,
            itemId: tourTarget?.itemId,
            itemDuration: tourTarget?.itemDuration,
            layoutImage: tourTarget?.layoutImage,
          });
          break;
        case 'infonode':
          navigation.replace('tourinfo', {
            data: tourTarget?.data,
            id: tourTarget?.id,
            nodes: tourTarget?.nodes,
            edges: tourTarget?.edges,
            itemMode: tourTarget?.itemMode,
            itemId: tourTarget?.itemId,
            itemDuration: tourTarget?.itemDuration,
            layoutImage: tourTarget?.layoutImage,
          });
          break;
        case 'picturenode':
          navigation.replace('tourinfo', {
            data: tourTarget?.data,
            id: tourTarget?.id,
            nodes: tourTarget?.nodes,
            edges: tourTarget?.edges,
            itemMode: tourTarget?.itemMode,
            itemId: tourTarget?.itemId,
            itemDuration: tourTarget?.itemDuration,
            layoutImage: tourTarget?.layoutImage,
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

  const backgroundImageName = layoutImage?.backgroundImage?.split('/').pop();
  const foregroundImageName = layoutImage?.foregroundImage?.split('/').pop();

  const folderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/BackgroundImages/i_tour_${itemId}`;

  const backgroundImagePath = folderPath
    ? `${folderPath}/${backgroundImageName}`
    : layoutImage?.backgroundImage;
  const foregroundImagePath = folderPath
    ? `${folderPath}/${foregroundImageName}`
    : layoutImage?.foregroundImage;

  const handleWebViewMessage = (event: { nativeEvent: { data: any } }) => {
    const message = event?.nativeEvent?.data;
    console.log('Received message from webview:', message);

    switch (message) {
      case 'quintour.start':
        runTourData({ targetId: 'none' });
        navigation.replace('welcome');
        break;

      default:
        console.warn('Unknown message from webview:', message);
    }
  };

  useEffect(() => {
    if (nodes?.[0]?.data?.diplay === 'web') {
      if (!loader && !imageLoader) {
        const payload = {
          type: 'quintour.ready',
        };
        webViewRef.current?.postMessage(JSON.stringify(payload));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, imageLoader]);

  return (
    <LayoutTransparent>
      {itemMode && (
        <View style={AppStyles.demoView}>
          <DemoIcon />
        </View>
      )}
      {nodes?.[0]?.data?.diplay === 'web' ? (
        <WebView
          ref={webViewRef}
          source={{
            uri: nodes?.[0]?.data?.url,
          }}
          style={{ flex: 1 }}
          onMessage={handleWebViewMessage}
        />
      ) : (
        <View style={styles.fullScreen}>
          {layoutImage?.backgroundImage === undefined ? (
            <LinearGradient
              colors={['#8D3EE8', '#423297']}
              style={styles.linearGradient}
            >
              <ImageBackground
                source={{ uri: `file://${foregroundImagePath}` }}
                resizeMode="contain"
                style={{
                  ...styles.foregroundImage,
                  aspectRatio:
                    layoutImage?.foregroundImage === undefined ||
                    layoutImage?.foregroundImage === ''
                      ? 4
                      : 1,
                }}
              >
                <View
                  style={{
                    ...styles.containerOuter,
                    backgroundColor:
                      layoutImage?.foregroundImage === undefined ||
                      layoutImage?.foregroundImage === ''
                        ? '#F4F4FC'
                        : 'transparent',
                  }}
                >
                  <View style={styles.container}>
                    <View style={styles.close}>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('tourendafterstart', {
                            itemMode: itemMode,
                            itemId,
                            layoutImage,
                          })
                        }
                      >
                        <Image
                          source={require('../../Asserts/close_btn.png')}
                        />
                      </TouchableOpacity>
                    </View>
                    {nodes?.[0]?.data?.image && (
                      <Image
                        source={{ uri: nodes?.[0]?.data?.image }}
                        resizeMode="contain"
                        style={{
                          width: '100%',
                          height: 150,
                          marginBottom: 20,
                        }}
                      />
                    )}
                    {!loader && !imageLoader && (
                      <Text
                        style={{
                          ...styles.para,
                          color: layoutImage?.foregroundTextColor || '#000',
                        }}
                      >
                        {nodes?.[0]?.data?.intro_text?.trim()
                          ? nodes[0].data.intro_text
                          : t('tour:start_tour_text')}{' '}
                      </Text>
                    )}
                    {loader && imageLoader && (
                      <Text
                        style={{
                          ...styles.para,
                          color: layoutImage?.foregroundTextColor || '#000',
                        }}
                      >
                        {t('common:loading')}
                      </Text>
                    )}
                    {loader && imageLoader ? (
                      <ActivityIndicator size="large" color="#000" />
                    ) : (
                      <TouchableOpacity
                        onPress={() => runTourData({ targetId: 'none' })}
                        style={{
                          backgroundColor:
                            layoutImage?.foregroundBtnColor === undefined
                              ? '#A659FE'
                              : layoutImage?.foregroundBtnColor,
                          width: 300,
                          padding: 20,
                          borderRadius: 33,
                        }}
                      >
                        <Text
                          style={{
                            textAlign: 'center',
                            fontFamily: Font.HelveticaBold,
                            fontSize: 20,
                            color:
                              layoutImage?.foregroundBtnTextColor === undefined
                                ? '#FFFFFF'
                                : layoutImage?.foregroundBtnTextColor,
                          }}
                        >
                          {t('tour:start_tour')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </ImageBackground>
            </LinearGradient>
          ) : (
            <ImageBackground
              source={{ uri: `file://${backgroundImagePath}` }}
              resizeMode="cover"
              style={styles.image}
            >
              <View style={styles.linearGradient}>
                <ImageBackground
                  source={{ uri: `file://${foregroundImagePath}` }}
                  resizeMode="contain"
                  style={{
                    ...styles.foregroundImage,
                    aspectRatio:
                      layoutImage?.foregroundImage === undefined ||
                      layoutImage?.foregroundImage === ''
                        ? 4
                        : 1,
                  }}
                >
                  <View
                    style={{
                      ...styles.containerOuter,
                      backgroundColor:
                        layoutImage?.foregroundImage === undefined ||
                        layoutImage?.foregroundImage === ''
                          ? '#F4F4FC'
                          : 'transparent',
                    }}
                  >
                    <View style={styles.container}>
                      <View style={styles.close}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate('tourendafterstart', {
                              itemMode: itemMode,
                              itemId,
                              layoutImage,
                            })
                          }
                        >
                          <Image
                            source={require('../../Asserts/close_btn.png')}
                          />
                        </TouchableOpacity>
                      </View>
                      {nodes?.[0]?.data?.image && (
                        <Image
                          source={{ uri: nodes?.[0]?.data?.image }}
                          resizeMode="contain"
                          style={{
                            width: '100%',
                            height: 150,
                            marginBottom: 20,
                          }}
                        />
                      )}
                      {!loader && !imageLoader && (
                        <Text
                          style={{
                            ...styles.para,
                            color: layoutImage?.foregroundTextColor || '#000',
                          }}
                        >
                          {nodes?.[0]?.data?.intro_text?.trim()
                            ? nodes[0].data.intro_text
                            : t('tour:start_tour')}{' '}
                        </Text>
                      )}
                      {loader && imageLoader && (
                        <Text
                          style={{
                            ...styles.para,
                            color: layoutImage?.foregroundTextColor || '#000',
                          }}
                        >
                          {t('common:loading')}
                        </Text>
                      )}
                      {loader && imageLoader ? (
                        <ActivityIndicator size="large" color="#000" />
                      ) : (
                        <TouchableOpacity
                          onPress={() => runTourData({ targetId: 'none' })}
                          style={{
                            backgroundColor:
                              layoutImage?.foregroundBtnColor === undefined
                                ? '#A659FE'
                                : layoutImage?.foregroundBtnColor,
                            width: 300,
                            padding: 20,
                            borderRadius: 33,
                          }}
                        >
                          <Text
                            style={{
                              textAlign: 'center',
                              fontFamily: Font.HelveticaBold,
                              fontSize: 20,
                              color:
                                layoutImage?.foregroundBtnTextColor ===
                                undefined
                                  ? '#FFFFFF'
                                  : layoutImage?.foregroundBtnTextColor,
                            }}
                          >
                            {t('tour:start_tour')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </ImageBackground>
              </View>
            </ImageBackground>
          )}
        </View>
      )}
    </LayoutTransparent>
  );
};

// define your styles
const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1A',
  },
  image: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  foregroundImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linearGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 36,
    width: '100%',
    borderRadius: 20,
  },
  containerOuter: {
    paddingBottom: 8,
    width: '90%',
    maxWidth: 600,
    marginHorizontal: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#A7A7A7',
    borderRadius: 20,
  },
  button: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 20,
    color: '#fff',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Font.HelveticaBold,
    color: COLOR.Primary,
  },
  para: {
    fontSize: 24,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 30,
    fontFamily: Font.Helvetica,
    // opacity: 0.5
  },
  close: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
});

//make this component available to the app
export default TourSingle;
