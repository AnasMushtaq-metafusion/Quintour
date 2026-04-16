//import liraries
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ImageBackground,
} from 'react-native';
import { COLOR, Font } from '../../Utils/variable';
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
import { handleRunTourOnFinish } from '../../Snipets/helpers';
import RNFS from 'react-native-fs';
import AppStyles from '../../Asserts/global-css/AppStyles';
import DemoIcon from '../../Asserts/svg/DemoIcon.svg';

// create a component
const TourEndAfterStart = ({ navigation, route }: any) => {
  const { resetTimer } = useTimer();
  const { isScore, subScore } = useScore();
  const { itemMode, itemId, layoutImage } = route.params;
  const [number, onChangeNumber] = React.useState<number | null>(null);
  const [error, isError] = React.useState<string | null>(null);
  const { t } = useTranslation(['common', 'tour']);
  const { getCountLocation } = useLocation();
  const { tourRunID } = useTourRunID();
  const { setShowToolbar } = useGlobal();
  const [isFocusedTextInput, setIsFocusedTextInput] = useState<boolean>(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleTourEnd = async () => {
    const code = (await _retrieveData('pinCode')) || 1234;

    if (number === code) {
      await _removeData('pinCode');

      handleRunTourOnFinish(itemId, tourRunID);

      navigation.replace('welcome');
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
      subScore(isScore ?? 0);
    };
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

  const backgroundImageName = layoutImage?.backgroundImage?.split('/').pop();
  const backgroundFolderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/BackgroundImages/i_tour_${itemId}`;
  const backgroundImagePath = backgroundFolderPath
    ? `${backgroundFolderPath}/${backgroundImageName}`
    : layoutImage?.backgroundImage;

  return (
    <LayoutTransparent>
      {itemMode && (
        <View style={AppStyles.demoView}>
          <DemoIcon />
        </View>
      )}
      <View style={styles.fullScreen}>
        <ImageBackground
          source={{ uri: `file://${backgroundImagePath}` }}
          style={styles.linearGradient}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              width: 700,
              paddingBottom: isFocusedTextInput ? 350 : 0,
            }}>
            <View style={styles.containerOuter}>
              <View style={styles.container}>
                <TextInput
                  style={styles.input}
                  onChangeText={(text: string) => onChangeNumber(Number(text))}
                  value={number?.toString()}
                  placeholder={t('tour:end_tour')}
                  keyboardType="numeric"
                  onFocus={() => setIsFocusedTextInput(true)}
                  onBlur={() => setIsFocusedTextInput(false)}
                />
                {error && <Text style={styles.para}>{error}</Text>}
                <View style={styles.btnsContainer}>
                  <TouchableOpacity
                    onPress={() => handleTourEnd()}
                    style={{
                      ...styles.endButton,
                      backgroundColor: layoutImage?.foregroundBtnColor
                        ? layoutImage?.foregroundBtnColor
                        : '#A659FE',
                      marginBottom: 10,
                    }}>
                    <Text
                      style={{
                        ...styles.buttonText,
                        color: layoutImage?.foregroundBtnTextColor
                          ? layoutImage?.foregroundBtnTextColor
                          : '#fff',
                      }}>
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
                    onPress={() => navigation.goBack()}>
                    <Text
                      style={{
                        ...styles.buttonText,
                        color: layoutImage?.foregroundBtnTextColor
                          ? layoutImage?.foregroundBtnTextColor
                          : '#fff',
                      }}>
                      {t('common:cancel')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </ImageBackground>
      </View>
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
    width: '47%',
    justifyContent: 'center',
    alignItems: 'center',
    height: 43,
    borderRadius: 33,
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
    paddingTop: 30,
    paddingBottom: 20,
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
    fontSize: 14,
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
});

//make this component available to the app
export default TourEndAfterStart;
