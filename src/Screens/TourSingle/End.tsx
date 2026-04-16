//import liraries
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { COLOR, Font } from '../../Utils/variable';
import RNFS from 'react-native-fs';

import LayoutTransparent from '../../Components/Global/layoutTransparent';
import {
  useGlobal,
  useLocation,
  useScore,
  useTourRunID,
} from '../../Snipets/GlobalContext';
import { useTimer } from '../../Snipets/TimeContext';
import {
  _removeData,
  _removeTourItemDetails,
  _removeTourPreviousNode,
  _removeTourStarted,
  _removeTourTargetNode,
  _retrieveData,
} from '../../Snipets/Asyncstorage';
import { useTranslation } from 'react-i18next';
import {
  handleRemoteMessage,
  handleRunTourOnFinish,
} from '../../Snipets/helpers';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { useIsFocused } from '@react-navigation/native';
import WebView from 'react-native-webview';
import AppStyles from '../../Asserts/global-css/AppStyles';
import DemoIcon from '../../Asserts/svg/DemoIcon.svg';

// create a component
const TourEnd = ({ navigation, route }: any) => {
  const { t } = useTranslation(['tour', 'common']);

  const { resetTimer } = useTimer();
  const { isScore, subScore } = useScore();
  const { itemMode, itemId, layoutImage, itemDuration, data } = route.params;
  const [neutralShow, isNeutralShow] = useState<boolean | null>(false);
  const [number, onChangeNumber] = React.useState<number | null>(null);
  const [error, isError] = React.useState<string | null>(null);
  const { getCountLocation } = useLocation();
  const { tourRunID } = useTourRunID();
  const [isFocusedTextInput, setIsFocusedTextInput] = useState<boolean>(false);
  const scrollRef = useRef<ScrollView>(null);
  const isFocused = useIsFocused();
  const { picturesMetaData, analyzePicturesArray, setShowToolbar } =
    useGlobal();

  const handleTourEnd = async () => {
    const code = (await _retrieveData('pinCode')) || 1234;
    if (number === code) {
      await _removeData('pinCode');
      handleRunTourOnFinish(itemId, tourRunID);
      if (picturesMetaData?.length > 0 || analyzePicturesArray?.length > 0) {
        navigation.replace('pictureupload', {
          layoutImage,
          itemId,
        });
      } else {
        navigation.replace('welcome');
      }
      subScore(isScore ?? 0);
    } else {
      if (itemMode) {
        isError(`Please enter valid number, Eg:${code}`);
      } else {
        isError('Please enter valid number, Eg:1234');
      }
    }
  };

  useEffect(() => {
    _removeTourStarted();
    _removeTourItemDetails();
    _removeTourTargetNode();
    _removeTourPreviousNode();
    getCountLocation(0);
    setShowToolbar(false);

    return () => {
      resetTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTimer, subScore]);

  useEffect(() => {
    if (isFocusedTextInput) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollToEnd({
            animated: true,
          });
        }
      }, 500);
    }
  }, [isFocusedTextInput]);

  const runTourData = () => {
    if (!neutralShow) {
      isNeutralShow(!neutralShow);
    } else {
      handleTourEnd();
    }
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

  const backgroundImageName = layoutImage?.backgroundImage?.split('/').pop();
  const backgroundFolderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/BackgroundImages/i_tour_${itemId}`;
  const backgroundImagePath = backgroundFolderPath
    ? `${backgroundFolderPath}/${backgroundImageName}`
    : layoutImage?.backgroundImage;

  const webViewRef = useRef<WebView>(null);

  const handleWebViewMessage = (event: { nativeEvent: { data: any } }) => {
    const message = event?.nativeEvent?.data;
    console.log('Received message from webview:', message);

    switch (message) {
      case 'quintour.data':
        console.log('Webview requested points');
        const payload = {
          type: 'quintour.data',
          score: isScore,
        };
        webViewRef.current?.postMessage(JSON.stringify(payload));
        break;

      case 'quintour.next':
        handleRunTourOnFinish(itemId, tourRunID);

        navigation.replace('welcome');
        break;

      case 'quintour.success':
        handleRunTourOnFinish(itemId, tourRunID);

        navigation.replace('welcome');
        break;

      case 'quintour.failed':
        handleRunTourOnFinish(itemId, tourRunID);

        navigation.replace('welcome');
        break;

      case 'quintour.end':
        isNeutralShow(true);
        break;

      default:
        console.warn('Unknown message from webview:', message);
    }
  };

  return (
    <LayoutTransparent>
      {itemMode && (
        <View style={AppStyles.demoView}>
          <DemoIcon />
        </View>
      )}
      {data?.display === 'web' && !neutralShow ? (
        <WebView
          ref={webViewRef}
          source={{ uri: data?.url }}
          style={{ flex: 1 }}
          onMessage={handleWebViewMessage}
        />
      ) : (
        <View style={styles.fullScreen}>
          <ImageBackground
            source={{ uri: `file://${backgroundImagePath}` }}
            style={styles.linearGradient}
          >
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center',
                width: 700,
                paddingBottom: isFocusedTextInput ? 350 : 0,
              }}
            >
              <View style={styles.containerOuter}>
                {!neutralShow ? (
                  <View style={styles.container}>
                    {data?.image && (
                      <Image
                        source={{ uri: data?.image }}
                        resizeMode="contain"
                        style={{
                          width: '100%',
                          height: 150,
                          marginBottom: 20,
                        }}
                      />
                    )}

                    {data?.intro_text && (
                      <Text
                        style={{
                          ...styles.para,
                          color: layoutImage?.foregroundTextColor,
                          width: '90%',
                        }}
                      >
                        {data?.intro_text}
                      </Text>
                    )}
                    <Text
                      style={{
                        ...styles.title,
                        color: layoutImage?.foregroundBtnTextColor,
                      }}
                    >
                      {t('tour:points')}
                    </Text>
                    <Text
                      style={{
                        ...styles.points,
                        backgroundColor: layoutImage?.foregroundBtnColor,
                        color: layoutImage?.foregroundBtnTextColor,
                      }}
                    >
                      {isScore}
                    </Text>
                    <TouchableOpacity
                      style={{
                        ...styles.endButton,
                        backgroundColor: layoutImage?.foregroundBtnColor
                          ? layoutImage?.foregroundBtnColor
                          : '#A659FE',
                      }}
                      onPress={() => isNeutralShow(!neutralShow)}
                    >
                      <Text
                        style={{
                          ...styles.buttonText,
                          color: layoutImage?.foregroundBtnTextColor
                            ? layoutImage?.foregroundBtnTextColor
                            : '#fff',
                        }}
                      >
                        {t('tour:end_tour')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.container}>
                    <TextInput
                      style={styles.input}
                      onChangeText={(text: string) =>
                        onChangeNumber(Number(text))
                      }
                      value={number?.toString()}
                      placeholder={t('tour:enter_code')}
                      keyboardType="numeric"
                      onFocus={() => setIsFocusedTextInput(true)}
                      onBlur={() => setIsFocusedTextInput(false)}
                    />
                    {error && <Text style={styles.para}>{error}</Text>}
                    <View style={styles.btnsContainer}>
                      <TouchableOpacity
                        style={{
                          ...styles.endButton,
                          backgroundColor: layoutImage?.foregroundBtnColor
                            ? layoutImage?.foregroundBtnColor
                            : '#A659FE',
                          marginBottom: 10,
                        }}
                        onPress={() => handleTourEnd()}
                      >
                        <Text
                          style={{
                            ...styles.buttonText,
                            color: layoutImage?.foregroundBtnTextColor
                              ? layoutImage?.foregroundBtnTextColor
                              : '#fff',
                          }}
                        >
                          {t('tour:end_tour')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          ...styles.endButton,
                          backgroundColor: layoutImage?.foregroundBtnColor
                            ? layoutImage?.foregroundBtnColor
                            : '#A659FE',
                        }}
                        onPress={() => isNeutralShow(!neutralShow)}
                      >
                        <Text
                          style={{
                            ...styles.buttonText,
                            color: layoutImage?.foregroundBtnTextColor
                              ? layoutImage?.foregroundBtnTextColor
                              : '#fff',
                          }}
                        >
                          {t('common:cancel')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </ImageBackground>
        </View>
      )}
    </LayoutTransparent>
  );
};

// define your styles
const styles = StyleSheet.create({
  btnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '70%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  endButton: {
    minWidth: '32%',
    justifyContent: 'center',
    alignItems: 'center',
    height: 43,
    borderRadius: 33,
    padding: 10,
    paddingHorizontal: '5%',
  },
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
  linearGradient: {
    flex: 1,
    width: '100%',
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 30,
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#F4F4FC',
  },
  containerOuter: {
    paddingBottom: 8,
    width: '90%',
    maxWidth: 400,
    marginHorizontal: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A7A7A7',
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 1,
    textAlign: 'center',
    fontFamily: Font.HelveticaBold,
    color: COLOR.Sky,
  },
  points: {
    width: 124,
    height: 30,
    fontSize: 20,
    marginBottom: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLOR.Blue,
    borderRadius: 30,
    fontFamily: Font.HelveticaBold,
    backgroundColor: COLOR.SkyLight,
  },
  para: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    color: COLOR.Purple,
    fontFamily: Font.Helvetica,
    opacity: 0.5,
  },
  close: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  input: {
    width: 300,
    height: 58,
    marginBottom: 20,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    textAlign: 'center',
    borderColor: COLOR.InputBorder,
    color: COLOR.Primary,
    fontFamily: Font.Helvetica,
    fontSize: 24,
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

//make this component available to the app
export default TourEnd;
