//import liraries
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
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
import { useTranslation } from 'react-i18next';
import TestModePopup from '../../../Snipets/TestModePopup';
import RenderHtml from 'react-native-render-html';
import { getHtmlConfig } from '../../../Utils/htmlRenderStyles';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import {
  handleRemoteMessageQuiz,
  handleRunTourOnLoad,
} from '../../../Snipets/helpers';
import { useIsFocused } from '@react-navigation/native';
import { playAudio } from '../../../Snipets/playAudio';
import AppStyles from '../../../Asserts/global-css/AppStyles';
import DemoIcon from '../../../Asserts/svg/DemoIcon.svg';
import * as Sentry from '@sentry/react-native';

// create a component
const TourQuiz = ({ navigation, route }: any) => {
  const [selectedAnswerInput, setSelectedAnswerInput] = useState<
    boolean | null
  >(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [value, onChangeText] = useState('');
  const [correct, isCorrect] = useState<boolean>(false);
  const { width } = useWindowDimensions();
  const [showError, setShowError] = useState(false);

  const [isDeactivatedLoading, setIsDeactivatedLoading] =
    useState<boolean>(true);

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
  const { getCountLocation, getTargetLocation } = useLocation();

  const { t } = useTranslation(['tour']);
  const scrollRef = useRef<ScrollView>(null);

  const [testMode, setTestMode] = useState<boolean>(false);
  const [isReset, setIsReset] = useState<boolean>(false);
  const [isFocusedTextInput, setIsFocusedTextInput] = useState<boolean>(false);
  const [incorrectAnswers, setIncorrectAnswers] = useState<Array<string>>([]);
  const [correctMultipleAnswers, setCorrectMultipleAnswers] = useState<
    Array<string>
  >([]);
  const [incorrectMultipleAnswers, setIncorrectMultipleAnswers] = useState<
    Array<string>
  >([]);
  const isFocused = useIsFocused();
  const [multipleAnswersBtnClicked, setMultipleAnswersBtnClicked] =
    useState(false);

  const progress = useRef(new Animated.Value(0)).current;

  const { addScore, isScore, subScore } = useScore();

  const handleSelect = (value: number) => {
    setShowError(false);
    if (multipleAnswersBtnClicked) {
      setMultipleAnswersBtnClicked(false);
      progress.setValue(0);
    }
    checkAnswers(value);
  };

  const htmlContent = useMemo(() => data?.question ?? '', [data?.question]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleSelectMultipleAnswers = () => {
    setMultipleAnswersBtnClicked(true);
    addScore(data?.score ?? 0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000, // duration of the animation
      useNativeDriver: false,
    }).start(() => {
      if (
        incorrectMultipleAnswers?.length === 0 &&
        data?.answers.filter((answer: any) => answer.isCorrect)?.length ===
          correctMultipleAnswers?.length
      ) {
        runTourData(correctMultipleAnswers.includes(value));
      } else {
        setShowError(true);
      }
    });
  };

  const checkAnswers = (value: any) => {
    const correctAnswers = data.answers
      .filter((answer: any) => answer.isCorrect)
      .map((answer: any) => answer.value);

    const isAlreadyCorrect = correctMultipleAnswers.includes(value);
    const isAlreadyIncorrect = incorrectMultipleAnswers.includes(value);

    // If already selected, toggle off
    if (isAlreadyCorrect) {
      setCorrectMultipleAnswers(prev => prev.filter(v => v !== value));
      return;
    } else if (isAlreadyIncorrect) {
      setIncorrectMultipleAnswers(prev => prev.filter(v => v !== value));
      return;
    }

    if (correctAnswers.includes(value)) {
      setCorrectMultipleAnswers(prev => [...prev, value]);

      if (data?.answer_condition !== 'and') {
        addScore(data?.score ?? 0);

        Animated.timing(progress, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }).start(() => {
          runTourData(correctAnswers.includes(value));
        });
      }
    } else {
      setIncorrectMultipleAnswers(prev => [...prev, value]);
      if (data?.answer_condition !== 'and') {
        Animated.timing(progress, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }).start(() => {
          runTourData(correctAnswers.includes(value));
        });
      }
    }
  };

  const handleInputChange = (text: string) => {
    onChangeText(text);

    const correctAnswers = data.answers
      .filter((answer: any) => answer.isCorrect)
      .map((answer: any) => answer.value.toLowerCase()); // Convert to lowercase for case-insensitive comparison

    const isCorrect = correctAnswers.some(
      (answer: string) => text.toLowerCase() === answer,
    );
    setIsAnswerCorrect(isCorrect); // Set the state based on whether it's correct or not
  };

  const progressInput = useRef(new Animated.Value(0)).current;
  const progressWidthInput = progressInput.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const checkInputAnswers = () => {
    setSelectedAnswerInput(true);

    if (isAnswerCorrect) {
      console.log('Correct answer');
      isCorrect(true);
      addScore(data?.score ?? 0);
    } else {
      setIncorrectAnswers(prev => [...prev, value]);
      isCorrect(false);
      console.log('Incorrect answer');
    }
    Animated.timing(progressInput, {
      toValue: 1,
      duration: 3000, // duration of the animation
      useNativeDriver: false,
    }).start(() => {
      console.log('Animate');
      if (isAnswerCorrect) {
        runTourData(isAnswerCorrect);
      } else {
        setSelectedAnswerInput(false);
        isCorrect(false);
        progressInput.setValue(0);
      }
    });
  };

  const runTourData = async (success: boolean) => {
    _storeTourPreviousNode({
      data: data,
      id: id,
      type: 'tourquiz',
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
        // Get the battery level (async call, so we need to await)
        const batteryLevel = await DeviceInfo.getBatteryLevel();

        const token = await _retrieveData('token');
        const myHeaders = new Headers();
        myHeaders.append('Authorization', `Bearer ${token}`);
        myHeaders.append('Cookie', 'SERVERID=webserver4');
        myHeaders.append('Content-Type', 'application/json');

        const nodeID = { 'node-id': id };

        // Create the request payload with the exact expected structure
        const raw = JSON.stringify({
          i_tourrun: tourRunID,
          score: isScore, // Ensure isScore is a number
          battery_level: Math.round(batteryLevel * 100), // Ensure battery level is a number
          geo_lat: currentPosition?.latitude, // Ensure latitude is a number
          geo_lng: currentPosition?.longitude, // Ensure longitude is a number
          wrong_answers: incorrectAnswers,
          action: 'leave',
          nodeid: id,
          state: JSON.stringify(nodeID),
          result: success ? 'success' : 'failed',
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
        fetchData();
      } catch (error) {
        console.error('error', error);
        Sentry.captureException(error); // <-- send to Sentry
      }
    }
  };

  useEffect(() => {
    const messagingInstance = getMessaging();

    const unsubscribeOnMessage = onMessage(messagingInstance, remoteMessage =>
      handleRemoteMessageQuiz(
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
      } else {
        setIsDeactivatedLoading(false);
      }
    } else if (data) {
      setIsDeactivatedLoading(false);
      handleRunTourOnLoad(itemId, id, tourRunID, currentPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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

    getTargetID(source?.target);

    onChangeText('');
    getTargetLocation('');

    setIsDeactivatedLoading(true);
    setIsAnswerCorrect(false);
    setSelectedAnswerInput(false);
    progressInput.setValue(0);
    progress.setValue(0);
    isCorrect(false);
    getTargetID(source?.target);
    setCorrectMultipleAnswers([]);
    setIncorrectMultipleAnswers([]);

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
  const encodedFileName = fileName ? encodeURIComponent(fileName) : null;
  const imagePath = encodedFileName ? `${folderPath}/${encodedFileName}` : '';
  const bannerUri = imagePath
    ? `file://${imagePath}`
    : data?.image_preview;

  const backgroundImageName = layoutImage?.backgroundImage?.split('/').pop();
  const foregroundImageName = layoutImage?.foregroundImage?.split('/').pop();

  const backgroundFolderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/BackgroundImages/i_tour_${itemId}`;

  const encodedBackgroundImageName = backgroundImageName
    ? encodeURIComponent(backgroundImageName)
    : null;
  const backgroundImagePath = encodedBackgroundImageName
    ? `${backgroundFolderPath}/${encodedBackgroundImageName}`
    : null;
  const backgroundImageUri = backgroundImagePath
    ? `file://${backgroundImagePath}`
    : layoutImage?.backgroundImage;
  const encodedForegroundImageName = foregroundImageName
    ? encodeURIComponent(foregroundImageName)
    : null;
  const foregroundImagePath = encodedForegroundImageName
    ? `${backgroundFolderPath}/${encodedForegroundImageName}`
    : null;
  const foregroundImageUri = foregroundImagePath
    ? `file://${foregroundImagePath}`
    : layoutImage?.foregroundImage;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [id]);
  const handleSuccess = async () => {
    if (data?.answer_type === 'input') {
      setSelectedAnswerInput(true);
      setIsAnswerCorrect(true);
      isCorrect(true);
      addScore(data?.score ?? 0);
      Animated.timing(progressInput, {
        toValue: 1,
        duration: 3000, // duration of the animation
        useNativeDriver: false,
      }).start(() => {
        runTourData(true);
      });
    } else if (data?.answer_type === 'multiplechoice') {
      const correctAnswer = data?.answers?.filter(
        (data: any) => data?.isCorrect,
      )[0]?.value;
      handleSelect(correctAnswer);
    } else {
      runTourData(true);
    }
  };

  const handleFailure = () => {
    setIsAnswerCorrect(false);

    if (data?.answer_type === 'input') {
      const falseAnswer = data?.answers?.find(
        (answer: any) => answer.isCorrect === false,
      )?.value;

      handleInputChange(falseAnswer || '');
      checkInputAnswers();
    } else if (data?.answer_type === 'multiplechoice') {
      const falseAnswer = data?.answers?.filter(
        (data: any) => data?.isCorrect === false,
      )[0]?.value;

      handleSelect(falseAnswer);
    } else {
      runTourData(false);
    }
  };

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

  const renderOptions = () => {
    return data?.answers?.map((ans: any, index: number) => (
      <View key={index} style={data?.answers?.length > 1 && styles.optionOuter}>
        <TouchableOpacity
          disabled={
            correctMultipleAnswers.includes(ans?.value) ||
            incorrectMultipleAnswers.includes(ans?.value)
              ? true
              : false
          }
          onPress={() => handleSelect(ans?.value)}
          style={[
            styles.option,
            {
              width: data?.answers?.length === 1 ? 300 : '100%',
              borderColor: correctMultipleAnswers.includes(ans?.value)
                ? COLOR.Green
                : incorrectMultipleAnswers.includes(ans?.value)
                ? COLOR.Red
                : layoutImage?.foregroundBtnColor
                ? layoutImage?.foregroundBtnColor
                : '#A659FE',
              backgroundColor: correctMultipleAnswers.includes(ans?.value)
                ? COLOR.Green
                : incorrectMultipleAnswers.includes(ans?.value)
                ? COLOR.Red
                : layoutImage?.foregroundBtnColor
                ? layoutImage?.foregroundBtnColor
                : '#A659FE',
            },
          ]}
        >
          <Text
            style={[
              styles.optionText,
              {
                color: layoutImage?.foregroundBtnTextColor ?? COLOR.White,
                textAlign: data?.answers?.length === 1 ? 'center' : 'left',
                paddingLeft: 20,
              },
            ]}
          >
            {ans?.value}
          </Text>

          {(correctMultipleAnswers.includes(ans?.value) ||
            incorrectMultipleAnswers.includes(ans?.value)) && (
            <Animated.View
              style={[
                styles.bar,
                {
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  width: progressWidth,
                  borderRadius: 25,
                },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>
    ));
  };

  const renderMultipleOptions = () => {
    return data?.answers?.map((ans: any, index: number) => (
      <View key={index} style={data?.answers?.length > 1 && styles.optionOuter}>
        <TouchableOpacity
          disabled={false}
          onPress={() => handleSelect(ans?.value)}
          style={[
            styles.option,
            // eslint-disable-next-line react-native/no-inline-styles
            {
              width: data?.answers?.length === 1 ? 300 : '100%',
              borderColor:
                correctMultipleAnswers.includes(ans?.value) ||
                incorrectMultipleAnswers.includes(ans?.value)
                  ? COLOR.Gray
                  : layoutImage?.foregroundBtnColor
                  ? layoutImage?.foregroundBtnColor
                  : '#A659FE',
              backgroundColor:
                correctMultipleAnswers.includes(ans?.value) ||
                incorrectMultipleAnswers.includes(ans?.value)
                  ? COLOR.Gray
                  : layoutImage?.foregroundBtnColor
                  ? layoutImage?.foregroundBtnColor
                  : '#A659FE',
            },
          ]}
        >
          <Text
            style={[
              styles.optionText,
              // eslint-disable-next-line react-native/no-inline-styles
              {
                color: layoutImage?.foregroundBtnTextColor ?? COLOR.White,
                textAlign: data?.answers?.length === 1 ? 'center' : 'left',
                paddingLeft: 20,
              },
            ]}
          >
            {ans?.value}
          </Text>
        </TouchableOpacity>
      </View>
    ));
  };

  const renderInputField = () => (
    <>
      <TextInput
        editable
        maxLength={40}
        onChangeText={handleInputChange}
        value={value}
        style={[
          styles.inputField,
          {
            color: data?.input_textcolor || '#1C1C1A',
            backgroundColor: data?.input_bgcolor || '#fff',
            borderColor: isFocusedTextInput
              ? layoutImage?.foregroundBtnColor || '#A659FE'
              : 'transparent',
            borderWidth: isFocusedTextInput ? 2 : 0,
          },
        ]}
        placeholder={data?.input_placeholder || t('tour:enter_answer')}
        placeholderTextColor={
          data?.input_textcolor ? `${data?.input_textcolor}80` : '#00000060'
        }
        onSubmitEditing={checkInputAnswers}
        returnKeyType="done"
        onFocus={() => setIsFocusedTextInput(true)}
        onBlur={() => setIsFocusedTextInput(false)}
      />
      <View style={{ minHeight: 30 }}>
        {correct && (
          <Text style={{ marginBottom: 10, color: COLOR.Green }}>
            {correct}
          </Text>
        )}
      </View>
      <TouchableOpacity
        disabled={selectedAnswerInput ? true : false}
        style={[
          styles.submitBTN,
          {
            backgroundColor: layoutImage?.foregroundBtnColor ?? '#A659FE',
          },
          selectedAnswerInput && {
            backgroundColor: correct ? COLOR.Green : COLOR.Red,
          },
        ]}
        onPress={checkInputAnswers}
      >
        <Text
          style={[
            styles.submitBTNText,
            {
              color: layoutImage?.foregroundBtnTextColor ?? '#fff',
            },
            selectedAnswerInput && {
              color: correct ? COLOR.White : COLOR.Primary,
            },
          ]}
        >
          {t('tour:confirm')}
        </Text>
        {selectedAnswerInput && (
          <Animated.View
            style={[
              styles.bar,
              {
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                width: progressWidthInput,
                borderRadius: 25,
              },
            ]}
          />
        )}
      </TouchableOpacity>
    </>
  );

  const renderContent = () => (
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
            {data?.answer_type === 'multiplechoice' && (
              <View style={styles.optionsContainer}>
                {data?.answer_condition === 'and'
                  ? renderMultipleOptions()
                  : renderOptions()}
              </View>
            )}
            {data?.answer_condition === 'and' &&
              data?.answer_type === 'multiplechoice' &&
              showError && (
                <Text
                  style={{
                    ...styles.para,
                    marginTop: '5%',
                    marginBottom: '5%',
                  }}
                >
                  {t('tour:quiz_error_text')}
                </Text>
              )}
            {data?.answer_condition === 'and' &&
              data?.answer_type === 'multiplechoice' && (
                <TouchableOpacity
                  style={{
                    ...styles.confirmBtn,
                    backgroundColor:
                      (incorrectMultipleAnswers?.length > 0 ||
                        data.answers.filter((answer: any) => answer.isCorrect)
                          ?.length !== correctMultipleAnswers?.length) &&
                      multipleAnswersBtnClicked
                        ? COLOR.Red
                        : correctMultipleAnswers?.length > 0 &&
                          multipleAnswersBtnClicked
                        ? COLOR.Green
                        : '#5B21B6',
                    marginTop: showError ? '0%' : '5%',
                  }}
                  onPress={() => handleSelectMultipleAnswers()}
                  disabled={
                    (incorrectMultipleAnswers?.length > 0 ||
                      correctMultipleAnswers?.length > 0) &&
                    isReset &&
                    !multipleAnswersBtnClicked
                      ? false
                      : true
                  }
                >
                  {isReset ? (
                    <Text
                      style={{
                        ...styles.buttonText,
                        color: '#fff',
                      }}
                    >
                      {t('tour:confirm')}
                    </Text>
                  ) : (
                    <ActivityIndicator
                      style={{ margin: 3 }}
                      color={layoutImage?.foregroundBtnTextColor ?? '#fff'}
                    />
                  )}
                  {(correctMultipleAnswers.length > 0 ||
                    incorrectMultipleAnswers?.length > 0) &&
                    multipleAnswersBtnClicked && (
                      <Animated.View
                        style={[
                          styles.bar,
                          {
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            width: progressWidth,
                            borderRadius: 25,
                          },
                        ]}
                      />
                    )}
                </TouchableOpacity>
              )}
            {data?.answer_type === 'input' && renderInputField()}
            {data?.answer_type !== 'multiplechoice' &&
              data?.answer_type !== 'input' && (
                <TouchableOpacity
                  style={{ width: '100%' }}
                  onPress={() => runTourData(true)}
                  disabled={!isReset}
                >
                  {isReset ? (
                    <Image
                      style={{ width: '100%' }}
                      resizeMode="contain"
                      source={require('../../../Asserts/weiter_btn.png')}
                    />
                  ) : (
                    <ActivityIndicator
                      style={{ margin: 3 }}
                      color={layoutImage?.foregroundBtnTextColor ?? '#fff'}
                    />
                  )}
                </TouchableOpacity>
              )}
          </View>
        </View>
      </ImageBackground>
    </View>
  );

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
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingBottom: isFocusedTextInput ? 350 : 0,
                }}
                ref={scrollRef}
              >
                {renderContent()}
              </ScrollView>
            </LinearGradient>
          ) : (
            <ImageBackground
              source={{ uri: backgroundImageUri }}
              resizeMode="cover"
              style={styles.image}
            >
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingBottom: isFocusedTextInput ? 350 : 0,
                }}
                ref={scrollRef}
              >
                {renderContent()}
              </ScrollView>
            </ImageBackground>
          )}
        </View>
      )}
      {testMode && (
        <TestModePopup
          onClick={() => setTestMode(!testMode)}
          handleNextScreen={() => runTourData(true)}
          handleLastScreen={() =>
            navigation.replace('tourend', {
              itemMode,
              itemId,
              layoutImage,
              itemDuration,
              data: target?.data,
            })
          }
          handleSuccess={handleSuccess}
          handleFailure={handleFailure}
        />
      )}
    </LayoutOverlay>
  );
};

// define your styles
const styles = StyleSheet.create({
  confirmBtn: {
    backgroundColor: '#5B21B6',
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    shadowColor: '#5B21B6',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
    fontFamily: Font.HelveticaBold,
    letterSpacing: 0.8,
  },
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
  },
  button: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 20,
    color: '#fff',
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
  close: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  qus: {
    fontSize: 20,
    paddingLeft: 25,
    marginLeft: 'auto',
    marginRight: 'auto',
    color: COLOR.Primary,
  },
  optionsContainer: {
    gap: 20,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionOuter: {
    flex: 1,
    minWidth: '40%',
    // marginBottom: 10,
    borderRadius: 25,
    backgroundColor: '#fff',
    shadowColor: '#000',
    position: 'relative',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1.4,
    elevation: 10,
  },
  option: {
    width: '100%',
    borderRadius: 25,
    borderWidth: 0,
    borderStyle: 'solid',
    alignItems: 'center',
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1.4,
    elevation: 10,
  },
  optionText: {
    zIndex: 2,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLOR.Primary,
    position: 'relative',
    fontFamily: Font.HelveticaBold,
  },
  inputField: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Font.HelveticaBold,
    alignItems: 'flex-start',
    minHeight: 56,
    textAlignVertical: 'center',
  },
  bar: {
    position: 'absolute',
    height: '100%',
    zIndex: 1,
    top: 0,
    left: 0,
  },
  submitBTN: {
    width: '100%',
    borderRadius: 50,
    backgroundColor: '#fff',
    shadowColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1.4,
    elevation: 10,
  },
  submitBTNText: {
    zIndex: 2,
    padding: 20,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLOR.Primary,
    position: 'relative',
    fontFamily: Font.HelveticaBold,
  },
});

//make this component available to the app
export default TourQuiz;
