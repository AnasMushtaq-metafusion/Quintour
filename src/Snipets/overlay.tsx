//import liraries
import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLOR, Font } from '../Utils/variable';
import CountdownTimer from './CountdownTimer';
import {
  useGlobal,
  useLocation,
  useScore,
  useTourRunID,
} from './GlobalContext';
import { useTranslation } from 'react-i18next';
import ConfirmPopup from './ConfirmPopup';
import ChevronDownIcon from '../Asserts/svg/ChevronDownIcon.svg';
import ChevronUpIcon from '../Asserts/svg/ChevronUpIcon.svg';
import RenderHTML from 'react-native-render-html';
import { getHtmlConfig } from '../Utils/htmlRenderStyles';
import CameraIcon from '../Asserts/svg/CameraIcon.svg';
import ImagePicker from 'react-native-image-crop-picker';
import { _retrieveData } from './Asyncstorage';
import CountUpTimer from './CountUpTimer';

// import { BlurView } from "@react-native-community/blur";
// import { useHelp } from './TimeContext';

// create a component
const Overlap = ({
  data,
  itemDuration,
  itemMode,
  setTestMode,
  setIsReset,
  isReset,
  itemId,
  layoutImage,
  handleEndTour,
}: any) => {
  const [help, isHelp] = useState(false);
  const [array, setArray] = useState<any[]>([]);
  const { isScore } = useScore();
  const [count, setCount] = useState(0);
  const [tipsUsedCounter, setTipsUsedCounter] = useState(0);

  const { totalLocation, countLocation, targetLocation } = useLocation();
  const { showToolbar, setShowToolbar, toolBarCameraIcon, durationCountdown } =
    useGlobal();
  const { setPicturesMetaData } = useLocation();
  const { tourRunID } = useTourRunID();

  const viewRef = useRef(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [displayedTips, setDisplayedTips] = useState<any[]>([]);
  const [tipCount, setTipCount] = useState(0);
  const { t } = useTranslation(['common', 'tour']);
  const [showAllBtns, setShowAllBtns] = useState(false);
  const [cutPenaltyPoints, setCutPenaltyPoints] = useState(false);
  const translateY = useRef(
    new Animated.Value(Dimensions.get('window').height),
  ).current; // Start from bottom
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleToggle = () => {
    const windowHeight = Dimensions.get('window').height;
    const toValue = showToolbar ? windowHeight : 0; // Animate to bottom or top

    Animated.timing(translateY, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setShowToolbar(!showToolbar);
  };

  const tips = data?.tips ?? [];

  // console.log('tips', tips);

  useEffect(() => {
    setArray([]);
    setCount(0);
    setDisplayedTips([]);
    setTipCount(0);
    setShowAllBtns(false);
    setCutPenaltyPoints(false);
    setShowToolbar(false);
    timeoutIdsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
    if (typeof setIsReset === 'function') {
      setIsReset(true);
    }
    // isHelpReset(0);
  }, [data]);

  useEffect(() => {
    if (isReset) {
      tips?.forEach((tip: any) => {
        if (tip?.available_after === 0) {
          setDisplayedTips(prevTips => [...prevTips, tip]);
          setTipCount(prevCount => prevCount + 1);
        } else {
          const timeoutId = setTimeout(() => {
            setDisplayedTips(prevTips => [...prevTips, tip]);
            setTipCount(prevCount => prevCount + 1);
          }, tip.available_after * 1000);

          // Store the timeout ID
          timeoutIdsRef.current.push(timeoutId);
        }
      });
    }
  }, [isReset]);

  function handleHelp(): void {
    const value = displayedTips?.length > count ? count + 1 : count;
    const obj = displayedTips?.filter((tip: any) => tip.sort === value)[0];
    console.log(value);

    setTipsUsedCounter(prevCount => prevCount + 1);
    setTipCount(prevCount => prevCount - 1);
    setCount(value);
    addObjectToArray(obj);
    console.log('displayedTips', displayedTips);

    // const eq = tips?.length < count;
    // console.log(tips?.length, eq, count);

    // if(eq){
    //     isHelp(!help);
    // }else{
    //     if (!timerStarted) {
    //         setTimerStarted(true);
    //         setCount(count + 1);

    //         if (tips && tips.length > 0) {
    //             const tipItem = tips?.filter((tip:any) => tip.sort === count + 1);
    //             const availableAfter = tipItem[0]?.available_after * 1000;

    //             timerRef.current = setTimeout(() => {
    //                 setHelpCount(1);
    //             }, availableAfter);
    //         }
    //     } else {
    //         if (helpCount > 0) {
    //             isHelp(!help);
    //             addObjectToArray(tips?.filter((tip:any) => tip.sort === count)[0]);
    //             setTimerStarted(false);
    //             setHelpCount(0);
    //         }
    //     }
    // }
  }

  // Cleanup the timer on unmount
  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
  }, []);

  // const addObjectToArray = (newObject:any) => {
  //     if(newObject === undefined) return;

  //     setArray((prevArray):any => [newObject, ...prevArray]);
  // };

  const addObjectToArray = (newObject: any) => {
    if (newObject === undefined) return;

    setArray((prevArray: any[]) => {
      // Check if the object with the same sort value already exists
      const isDuplicate = prevArray.some(obj => obj.sort === newObject.sort);

      // If it's not a duplicate, add the new object to the array
      if (!isDuplicate) {
        return [newObject, ...prevArray];
      }

      // If it's a duplicate, return the original array without changes
      return prevArray;
    });
  };

  const handleResolution = () => {
    setTipsUsedCounter(displayedTips?.length);

    setTipCount(0);
    setArray(displayedTips.sort((a, b) => b.sort - a.sort));
  };

  const handleSendPicture = () => {
    ImagePicker.openCamera({
      mediaType: 'photo',
      compressImageQuality: 0.7,
      multiple: false,
    })
      .then(async image => {
        if (image) {
          const localUri = image.path;
          const filename = localUri.split('/').pop();
          const match = filename ? /\.(\w+)$/.exec(filename) : null;
          const type = match ? `image/${match[1]}` : `image`;
          const file = { uri: localUri, name: filename, type };
          setPicturesMetaData((prevData: any[]) => [
            ...prevData,
            { picture: file, tourRunID, i_tour: itemId },
          ]);
        }
      })
      .catch(error => {
        if (!error.message.includes('User cancelled image selection')) {
          Alert.alert(
            'Media permission denied',
            'Please go to Settings and grant photos/media permission to use this feature.',
          );
        }
      });
  };

  // const reorderTips = (tips:any, count:any) => {
  //     // Create a copy of the array to avoid mutating the original array
  //     const tipsCopy = [...tips];

  //     // Find the object with the matching sort value
  //     const index = tipsCopy.findIndex(tip => tip.sort === count);

  //     // If an object with the matching sort value is found, move it to the front
  //     if (index !== -1) {
  //       const [movedTip] = tipsCopy.splice(index, 1);
  //       tipsCopy.unshift(movedTip);
  //     }

  //     return tipsCopy;
  //   }

  // console.log('count', count);
  // console.log('data', itemDuration);
  // console.log('data', itemDuration === null || itemDuration === 0 ? 'timer' : 'countdown timer');

  // const tipsPenalty = tips?.filter((tip:any) => tip.sort === count)[0] ?? {};
  // const TipsList = reorderTips(tips, count);

  return (
    <>
      {/* <View style={[styles.location, {opacity: show ? 1 : 0}]}>
                {targetLocation && (
                    <View style={styles.locationItem}>
                        <Image
                            source={require('../Asserts/map-marker.png')}
                        />
                        <Text style={styles.locationText}>Rathausmarkt</Text>
                    </View>
                )}
            </View> */}

      <Animated.View
        style={[
          styles.navigation,
          {
            transform: [{ translateY }],
            opacity: showToolbar ? 1 : 0,
            backgroundColor: layoutImage?.menuColor
              ? layoutImage?.menuColor
              : 'rgba(255, 255, 255, 0.9)',
          },
        ]}
        ref={viewRef}
      >
        {/* <BlurView
                    style={styles.absolute}
                    viewRef={viewRef}
                    blurType="light"
                    blurAmount={40}
                    reducedTransparencyFallbackColor="rgba(255,255,255,0)"
                /> */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: layoutImage?.menuTextColor
                ? layoutImage?.menuTextColor
                : COLOR.BlueDark,
              width: 50,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => handleToggle()}
          >
            <ChevronDownIcon
              style={{
                color: layoutImage?.menuColor
                  ? layoutImage?.menuColor
                  : 'rgba(255, 255, 255, 0.9)',
              }}
            />
          </TouchableOpacity>
          <Text
            style={{
              ...styles.time,
              color: layoutImage?.menuTextColor
                ? layoutImage?.menuTextColor
                : COLOR.BlueDark,
            }}
          >
            {durationCountdown === true ? (
              <CountdownTimer
                initialTime={itemDuration}
                handleEndTour={handleEndTour}
              />
            ) : (
              <CountUpTimer
                duration={itemDuration}
                handleEndTour={handleEndTour}
              />
            )}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            flex: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <View style={styles.navigationBtns}>
            <View style={styles.navigationBtn}>
              <Text
                style={{
                  ...styles.navigationBtnText,
                  color: layoutImage?.menuTextColor
                    ? layoutImage?.menuTextColor
                    : COLOR.BlueDark,
                }}
              >
                {t('tour:help')}
              </Text>
              <Text
                style={{
                  ...styles.navigationBtnNumber,
                  color: layoutImage?.menuTextColor
                    ? layoutImage?.menuTextColor
                    : COLOR.BlueDark,
                }}
              >
                {tipsUsedCounter ?? 0}
              </Text>
            </View>
            <View style={styles.navigationBtn}>
              <Text
                style={{
                  ...styles.navigationBtnText,
                  color: layoutImage?.menuTextColor
                    ? layoutImage?.menuTextColor
                    : COLOR.BlueDark,
                }}
              >
                Score
              </Text>
              <Text
                style={{
                  ...styles.navigationBtnNumber,
                  color: layoutImage?.menuTextColor
                    ? layoutImage?.menuTextColor
                    : COLOR.BlueDark,
                }}
              >
                {isScore >= 0 ? isScore : 0}
              </Text>
            </View>
            <View style={styles.navigationBtn}>
              <Text
                style={{
                  ...styles.navigationBtnText,
                  color: layoutImage?.menuTextColor
                    ? layoutImage?.menuTextColor
                    : COLOR.BlueDark,
                }}
              >
                Spot
              </Text>
              <Text
                style={{
                  ...styles.navigationBtnNumber,
                  color: layoutImage?.menuTextColor
                    ? layoutImage?.menuTextColor
                    : COLOR.BlueDark,
                }}
              >
                {countLocation}/{totalLocation}
              </Text>
            </View>
          </View>
          {/* <View style={styles.hl}></View> */}
          <View style={styles.navigationIcons}>
            {/* <TouchableOpacity>
                            <Image
                                source={require('../Asserts/chat-icon.png')}
                                style={{height: 58}}
                            />
                        </TouchableOpacity> */}

            {toolBarCameraIcon && (
              <TouchableOpacity
                style={styles.cameraIcon}
                onPress={() => handleSendPicture()}
              >
                <CameraIcon />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                ...styles.helpBtn,
                backgroundColor:
                  displayedTips?.length === 0
                    ? COLOR.Gray
                    : layoutImage?.helpMenuColor
                    ? layoutImage?.helpMenuColor
                    : '#423297',
                flexDirection: 'row',
              }}
              disabled={displayedTips?.length === 0 ? true : false}
              onPress={() => {
                if (displayedTips?.length > 0) {
                  if (tipCount === 0) {
                    isHelp(!help);
                  } else if (displayedTips?.length > tipCount) {
                    setShowAllBtns(true);
                    isHelp(!help);
                  } else {
                    setCutPenaltyPoints(true);
                    handleHelp();
                    isHelp(!help);
                  }
                }
              }}
            >
              <View style={styles.tipCountContainer}>
                <Text style={styles.tipCountText}>{tipCount}</Text>
              </View>
              <Text
                style={{
                  ...styles.helpBtnText,
                  color: layoutImage?.helpMenuTextColor
                    ? layoutImage?.helpMenuTextColor
                    : '#fff',
                }}
              >
                {t('tour:help')} ?
              </Text>
            </TouchableOpacity>

            {itemMode && (
              <TouchableOpacity
                style={{
                  paddingHorizontal: 4,
                  backgroundColor: COLOR.Gray,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 16,
                }}
                onPress={() => setTestMode(true)}
              >
                <Text>Test Mode</Text>
              </TouchableOpacity>
            )}
            {/* <TouchableOpacity>
                            <Image
                                source={require('../Asserts/photo-icon.png')}
                                style={{height: 58}}
                            />
                        </TouchableOpacity> */}
            {/* <TouchableOpacity style={{position: 'relative', top: 2}}>
                            <Image
                                source={require('../Asserts/lamp-icon.png')}
                                style={{height: 58}}
                            />
                        </TouchableOpacity> */}
          </View>
        </View>
        <View>
          {targetLocation !== '' && (
            <View style={styles.navigationBtn}>
              <Text style={styles.navigationBtnNumber}>
                {t('common:i_am_here')}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      <View
        style={[
          styles.timer,
          {
            opacity: showToolbar ? 0 : 1, // Show or hide based on 'show' state
            backgroundColor: layoutImage?.menuColor
              ? layoutImage?.menuColor
              : 'rgba(255, 255, 255, 0.9)',
          },
        ]}
        ref={viewRef}
      >
        {/* <ImageBackground source={require('../Asserts/timeBg.png')} resizeMode="contain" style={styles.timerInner}>
                    
                </ImageBackground> */}
        {/* <BlurView
                    style={styles.absolute}
                    viewRef={viewRef}
                    blurType="light"
                    blurAmount={40}
                    reducedTransparencyFallbackColor="white"
                /> */}
        <TouchableOpacity
          style={{
            backgroundColor: layoutImage?.menuTextColor
              ? layoutImage?.menuTextColor
              : COLOR.BlueDark,
            width: 50,
            height: 64,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => handleToggle()}
        >
          <ChevronUpIcon
            style={{
              color: layoutImage?.menuColor
                ? layoutImage?.menuColor
                : 'rgba(255, 255, 255, 0.9)',
            }}
          />
        </TouchableOpacity>
        <Text
          style={{
            ...styles.timeCount,
            color: layoutImage?.menuTextColor
              ? layoutImage?.menuTextColor
              : COLOR.BlueDark,
          }}
        >
          {durationCountdown === true ? (
            <CountdownTimer
              initialTime={itemDuration}
              handleEndTour={handleEndTour}
            />
          ) : (
            <CountUpTimer
              duration={itemDuration}
              handleEndTour={handleEndTour}
            />
          )}
        </Text>
      </View>

      {help && (
        <HelpPopup
          tips={array}
          tipSortCount={count}
          onClick={() => {
            isHelp(!help);
            setCutPenaltyPoints(false);
          }}
          showAllBtns={showAllBtns}
          setShowAllBtns={setShowAllBtns}
          handleHelp={handleHelp}
          handleResolution={handleResolution}
          cutPenaltyPoints={cutPenaltyPoints}
          setCutPenaltyPoints={setCutPenaltyPoints}
          layoutImage={layoutImage}
          tipCount={tipCount}
        />
      )}
    </>
  );
};

const HelpPopup = ({
  tips,
  onClick,
  tipSortCount,
  showAllBtns,
  setShowAllBtns,
  handleHelp,
  handleResolution,
  cutPenaltyPoints,
  setCutPenaltyPoints,
  layoutImage,
  tipCount,
}: any) => {
  // console.log(tips);
  const viewRef = useRef(null);
  const { subScore } = useScore();
  const [show, setShow] = useState(false);
  const windowHeight = Dimensions.get('window').height;
  const tipsPenalty =
    tips?.filter((tip: any) => tip?.sort === tipSortCount)[0] ?? {};
  const scrollRef = useRef<ScrollView>(null);
  const { t } = useTranslation(['tour', 'common']);
  const [confirmPopup, setConfirmPopup] = useState(false);

  const { width } = useWindowDimensions();

  useEffect(() => {
    if (tipsPenalty?.penalty_points > 0 && cutPenaltyPoints) {
      subScore(tipsPenalty?.penalty_points ?? 0);
    }
    setShow(true);
    // console.log(tips);

    // const timeout = tipsPenalty?.available_after * 1000;

    // const timer = setTimeout(() => {
    //     // setShow(true);
    //     setHelpCount(1);
    // }, timeout);

    // return () => clearTimeout(timer);
  }, [tipSortCount]);

  // const handleHelpClick = () => {
  //     if (helpCount > 0) {
  //         setShow(true);
  //     }
  // };

  return (
    <>
      {show && (
        <View
          style={[styles.containerFixed, { top: show ? 0 : '100%' }]}
          ref={viewRef}
        >
          {/* <BlurView
                style={styles.absolute}
                viewRef={viewRef}
                    blurType="light"
                blurAmount={10}
                reducedTransparencyFallbackColor="white"
            /> */}
          <View style={styles.containerOuter}>
            <View style={styles.container}>
              {/* <View style={styles.close}>
                        <TouchableOpacity onPress={() => onClick()}>
                            <Image
                                source={require('../Asserts/help_close_btn.png')}
                            />
                        </TouchableOpacity>
                    </View> */}
              <ScrollView
                endFillColor={COLOR.Purple}
                style={{
                  maxHeight: windowHeight - 300,
                  marginBottom: 15,
                  width: '100%',
                }}
                ref={scrollRef}
              >
                {tips?.length > 0 &&
                  tips?.map((tip: any, index: number) => (
                    <View style={styles.helpCard} key={index}>
                      <Text style={styles.title}>{tip?.title}</Text>
                      <RenderHTML
                        contentWidth={width}
                        source={{ html: tip?.text }}
                        {...getHtmlConfig(18, 26)}
                      />
                    </View>
                  ))}
                {/* {tips?.filter((item:any) => item?.sort !== tipSortCount).map((tip:any, index:number) => (
                            <View style={styles.helpCard} key={index}>
                                <Text style={styles.title}>{tip?.title}</Text>
                                <Text style={styles.para}>{tip?.text}</Text>
                            </View>
                        ))} */}
              </ScrollView>

              {showAllBtns ? (
                <View>
                  <Text style={styles.helpText}>
                    {t('tour:need_more_help')}
                  </Text>
                  <View style={styles.threeBtnsContainer}>
                    <TouchableOpacity
                      style={{
                        ...styles.helpButton,
                        width: '33%',
                        backgroundColor: layoutImage?.foregroundBtnColor
                          ? layoutImage?.foregroundBtnColor
                          : 'red',
                      }}
                      onPress={() => {
                        handleHelp();
                        setShowAllBtns(false);
                        if (scrollRef.current) {
                          scrollRef.current.scrollTo({ y: 0, animated: true });
                        }
                        setCutPenaltyPoints(true);
                      }}
                    >
                      <Text
                        style={{
                          ...styles.buttonText,
                          color: layoutImage?.foregroundBtnTextColor
                            ? layoutImage?.foregroundBtnTextColor
                            : '#fff',
                        }}
                      >
                        {t('tour:accept_help')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        ...styles.helpButton,
                        width: '33%',
                        backgroundColor: layoutImage?.foregroundBtnColor
                          ? layoutImage?.foregroundBtnColor
                          : '#A659FE',
                      }}
                      onPress={() => {
                        setShow(!show);
                        setConfirmPopup(!confirmPopup);
                      }}
                    >
                      <Text
                        style={{
                          ...styles.buttonText,
                          color: layoutImage?.foregroundBtnTextColor
                            ? layoutImage?.foregroundBtnTextColor
                            : '#fff',
                        }}
                      >
                        {t('tour:resolution')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        ...styles.helpButton,
                        width: '33%',
                        backgroundColor: layoutImage?.foregroundBtnColor
                          ? layoutImage?.foregroundBtnColor
                          : '#A659FE',
                      }}
                      onPress={() => {
                        onClick(), setShow(false);
                      }}
                    >
                      <Text
                        style={{
                          ...styles.buttonText,
                          color: layoutImage?.foregroundBtnTextColor
                            ? layoutImage?.foregroundBtnTextColor
                            : '#fff',
                        }}
                      >
                        {t('common:close')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    ...styles.helpButton,
                    backgroundColor: layoutImage?.foregroundBtnColor
                      ? layoutImage?.foregroundBtnColor
                      : '#A659FE',
                  }}
                  onPress={() => {
                    onClick(), setShow(false);
                  }}
                >
                  <Text
                    style={{
                      ...styles.buttonText,
                      color: layoutImage?.foregroundBtnTextColor
                        ? layoutImage?.foregroundBtnTextColor
                        : '#fff',
                    }}
                  >
                    {t('common:close')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
      {confirmPopup && (
        <ConfirmPopup
          onClick={() => {
            handleResolution();
            setShowAllBtns(false);
            if (scrollRef.current) {
              scrollRef.current.scrollTo({ y: 0, animated: true });
            }
            setConfirmPopup(!confirmPopup);
            setShow(!show);
            subScore(tipCount * tipsPenalty?.penalty_points);
          }}
          onCancel={() => {
            setConfirmPopup(!confirmPopup);
            setShow(!show);
          }}
          heading={t('tour:resolution_confirmation')}
          subHeading={t('tour:skip_further_help_text')}
          layoutImage={layoutImage}
        />
      )}
    </>
  );
};

// define your styles
const styles = StyleSheet.create({
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  helpButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    height: 43,
    borderRadius: 33,
  },
  helpBtn: {
    height: 50,
    width: 88,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderRadius: 16,
  },
  helpBtnText: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: Font.Helvetica,
    color: '#fff',
  },
  location: {
    top: 30,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
    position: 'absolute',
    justifyContent: 'center',
  },
  locationItem: {
    gap: 12,
    padding: 12,
    borderRadius: 16,
    flexWrap: 'nowrap',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.PurpleLight,
  },
  locationText: {
    fontSize: 24,
    color: COLOR.White,
    fontWeight: 'bold',
  },
  navigation: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    paddingVertical: 1,
    overflow: 'hidden',
    height: 64,
    width: '100%',
    bottom: 0,
    zIndex: 2,
  },
  navigationBtns: {
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    gap: 20,
  },
  navigationIcons: {
    flexDirection: 'row',
    marginRight: 24,
    gap: 12,
  },
  navigationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navigationBtnText: {
    fontSize: 18,
    color: COLOR.BlueDark,
    lineHeight: 25,
    fontWeight: '400',
    fontFamily: Font.Helvetica,
  },
  navigationBtnNumber: {
    fontSize: 24,
    color: COLOR.BlueDark,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: Font.HelveticaBold,
  },
  threeBtnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  helpText: {
    color: COLOR.Primary,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Font.HelveticaBold,
    paddingBottom: 15,
  },

  hl: {
    backgroundColor: COLOR.Border,
    marginLeft: 15,
    marginRight: 5,
    height: 45,
    width: 2,
  },
  time: {
    width: 126,
    fontSize: 24,
    color: COLOR.BlueDark,
    // lineHeight: 62,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Font.HelveticaBold,
  },
  timeCount: {
    fontSize: 24,
    color: COLOR.BlueDark,
    // lineHeight: 64,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    fontFamily: Font.HelveticaBold,
  },
  timer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopRightRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    overflow: 'hidden',
    width: 200,
    bottom: 0,
    zIndex: 1,
    right: 0,
    left: 0,
  },
  timerInner: {
    width: 200,
    height: 64,
    borderTopRightRadius: 32,
  },
  containerFixed: {
    flex: 1,
    left: 0,
    zIndex: 3,
    width: '100%',
    height: '100%',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    alignItems: 'center',
    width: '100%',
    borderRadius: 20,
    paddingBottom: 36,
    paddingTop: 30,
    paddingHorizontal: 36,
    backgroundColor: COLOR.White,
  },
  containerOuter: {
    paddingBottom: 8,
    width: '90%',
    maxWidth: 800,
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
    left: 12,
    fontSize: 20,
    marginTop: -13,
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    position: 'absolute',
    color: COLOR.Primary,
    paddingHorizontal: 8,
    backgroundColor: COLOR.White,
    fontFamily: Font.HelveticaBold,
  },
  para: {
    fontSize: 20,
    lineHeight: 36,
    marginBottom: 0,
    color: COLOR.Primary,
    fontFamily: Font.Helvetica,
  },
  close: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  helpCard: {
    borderColor: COLOR.BorderHelp,
    borderStyle: 'solid',
    position: 'relative',
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 15,
    padding: 20,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    // zIndex: -1
  },
  tipCountContainer: {
    backgroundColor: '#fff',
    height: '93%',
    width: '25%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    marginHorizontal: 2,
  },
  tipCountText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Font.HelveticaBold,
    color: '#423297',
  },
  cameraIcon: {
    paddingHorizontal: 4,
    backgroundColor: COLOR.White,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    width: 50,
  },
});

//make this component available to the app
export default Overlap;
