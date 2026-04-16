// Import necessary libraries
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { useGlobal } from '../../Snipets/GlobalContext';
import LayoutTransparent from '../../Components/Global/layoutTransparent';
import { useTranslation } from 'react-i18next';
import RNFS from 'react-native-fs';
import { Font } from '../../Utils/variable';
import { analyzePictureByAi, sendPictureToServer } from '../../Snipets/helpers';

// Create a component
const PictureUploadScreen = ({ route, navigation }: any) => {
  const [progress, setProgress] = useState(0); // Example progress value
  const {
    picturesMetaData,
    analyzePicturesArray,
    setPicturesMetaData,
    setAnalyzePicturesArray,
  } = useGlobal();

  const { t } = useTranslation(['common']);

  const { layoutImage, itemId } = route.params;
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleCancel = () => {
    // Navigate immediately
    navigation.replace('welcome', { uploadPics: true });
  };

  const handleStart = async () => {
    setIsSubmitted(true);
    const totalItems = picturesMetaData.length + analyzePicturesArray.length;
    let completed = 0;

    const updateProgress = () => {
      completed += 1;
      setProgress(completed / totalItems);
    };

    for (const data of picturesMetaData) {
      await sendPictureToServer(data.picture, data.i_tour, data.tourRunID);
      updateProgress();
    }

    for (const data of analyzePicturesArray) {
      await analyzePictureByAi(
        data.picture,
        data.i_tour,
        data.tourRunID,
        data.analyseData,
        'node_picture',
      );
      updateProgress();
    }

    // Ensure progress is set to 1 (100%) at the end
    setIsSubmitted(false);
    setProgress(1);
    setTimeout(() => {
      navigation.replace('welcome'); // ✅ Navigate to desired screen
    }, 200);
    setPicturesMetaData([]);
    setAnalyzePicturesArray([]);
  };

  const backgroundImageName = layoutImage?.backgroundImage?.split('/').pop();
  const backgroundFolderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/BackgroundImages/i_tour_${itemId}`;
  const backgroundImagePath = backgroundFolderPath
    ? `${backgroundFolderPath}/${backgroundImageName}`
    : layoutImage?.backgroundImage;

  return (
    <LayoutTransparent>
      <View style={styles.fullScreen}>
        <ImageBackground
          source={{ uri: `file://${backgroundImagePath}` }}
          style={styles.linearGradient}>
          <View style={styles.containerOuter}>
            <View style={styles.container}>
              <Text style={styles.heading}>Bilder synchronisierung</Text>
              <Progress.Bar
                progress={progress}
                width={350}
                borderRadius={10}
                unfilledColor="#fff"
                height={15}
              />
              <View style={styles.btnsContainer}>
                <TouchableOpacity
                  style={{
                    ...styles.endButton,
                    backgroundColor: layoutImage?.foregroundBtnColor
                      ? layoutImage?.foregroundBtnColor
                      : '#A659FE',
                    marginBottom: 10,
                  }}
                  onPress={() => handleCancel()}>
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
                <TouchableOpacity
                  disabled={isSubmitted}
                  style={{
                    ...styles.endButton,
                    backgroundColor: layoutImage?.foregroundBtnColor
                      ? layoutImage?.foregroundBtnColor
                      : '#A659FE',
                  }}
                  onPress={() => handleStart()}>
                  <Text
                    style={{
                      ...styles.buttonText,
                      color: layoutImage?.foregroundBtnTextColor
                        ? layoutImage?.foregroundBtnTextColor
                        : '#fff',
                    }}>
                    {t('common:start')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </LayoutTransparent>
  );
};

// Define styles
const styles = StyleSheet.create({
  heading: {
    fontSize: 28,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Font.HelveticaBold,
    color: '#000',
  },
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
  },
  fullScreen: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1A',
  },
  linearGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#F4F4FC',
    height: '100%',
    justifyContent: 'space-around',
  },
  containerOuter: {
    width: 500,
    marginHorizontal: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A7A7A7',
    borderRadius: 20,
    height: '50%',
  },
});

// Export the component
export default PictureUploadScreen;
