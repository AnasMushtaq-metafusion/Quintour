//import liraries
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BASE_URL, COLOR, Font, PROD_BASE_URL } from '../Utils/variable';
import {
  _isTourStarted,
  _retrieveData,
  _storeData,
  _storeTourItemDetails,
} from './Asyncstorage';
import RNFS from 'react-native-fs';
import { useGlobal } from './GlobalContext';
import * as Sentry from '@sentry/react-native';

// create a component

const CardLocation = ({ item, navigation }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setToolBarCameraIcon, setDurationCountdown } = useGlobal();

  const fetchDataCall = async () => {
    setIsLoading(true);
    const token = await _retrieveData('token');
    const myHeaders = new Headers();
    myHeaders.append('Authorization', `Bearer ${token}`);
    myHeaders.append('Cookie', 'SERVERID=webserver4');

    const requestOptions: RequestInit = {
      method: 'GET',
      headers: myHeaders,
    };

    try {
      const response = await fetch(
        `${
          item?.device_test_mode ? BASE_URL : PROD_BASE_URL
        }/tours/${JSON.stringify(item?.i_tour)}`,
        requestOptions,
      );

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        Sentry.captureException(
          new Error(`Failed to fetch tour: ${response.status}`),
        );
        return;
      }

      const result = await response.json();

      _isTourStarted(true);

      const layout = JSON.parse(result?.layout);

      const layoutImage = {
        backgroundImage: layout?.screen_background_img,
        foregroundImage: layout?.screen_foreground_img,
        mapOverlayImage: layout?.map_overlay_img,
        foregroundImagePadding: layout?.screen_foreground_img_padding,
        foregroundTextPadding: layout?.screen_foreground_txt_padding,
        foregroundTextColor: layout?.screen_foreground_txt_color,
        foregroundBtnTextColor: layout?.screen_foreground_btn_txt_color,
        foregroundBtnColor: layout?.screen_foreground_btn_color,
        imagePadding: layout?.screen_foreground_img_padding,
        menuColor: layout?.menu_color,
        mapLayout: layout?.map_layout,
        menuTextColor: layout?.menu_txt_color,
        helpMenuColor: layout?.help_menu_color,
        helpMenuTextColor: layout?.help_menu_txt_color,
      };

      _storeTourItemDetails({
        itemId: item?.i_tour,
        itemImg: item?.image_url,
        itemMode: item?.device_test_mode,
        itemDuration: item?.duration,
        layoutImage,
      });

      let imagesArray: string[] = [];

      if (layoutImage?.foregroundImage) {
        imagesArray = imagesArray.concat(layoutImage.foregroundImage);
      }

      if (layoutImage?.backgroundImage) {
        imagesArray = imagesArray.concat(layoutImage.backgroundImage);
      }

      if (layoutImage?.mapOverlayImage) {
        imagesArray = imagesArray.concat(layoutImage.mapOverlayImage);
      }

      if (imagesArray?.length > 0) {
        await downloadImageFile(imagesArray, item?.i_tour);
      }
      _storeData('pinCode', result?.pin_code ?? 1234);

      setToolBarCameraIcon(item?.toolbar_camera_enabled);

      setDurationCountdown(item?.duration_countdown);

      navigation.replace('toursingle', {
        itemId: item?.i_tour,
        itemImg: item?.image_url,
        itemMode: item?.device_test_mode,
        itemDuration: item?.duration,
        layoutImage,
      });
    } catch (error) {
      Sentry.captureException(error); // <-- send to Sentry

      console.log('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImageFile = async (
    imageList: string[],
    id: any,
  ): Promise<void> => {
    // const hasPermission = await requestStoragePermission();
    // if (!hasPermission) {
    //     Alert.alert('Error', 'Storage permission denied');
    //     return;
    // }

    const downloadFiles = imageList ?? [];

    const folderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/BackgroundImages/i_tour_${id}`;

    try {
      // Create directories if they don't exist
      await RNFS.mkdir(folderPath);
      console.log('Directory created at:', folderPath);
    } catch (error) {
      console.log('Directory could not be created:', error);
      Alert.alert('Error', 'Directory could not be created');
      return; // Exit the function if the directory cannot be created
    }

    const downloadPromises = downloadFiles.map(async (fileUrl: string) => {
      const fileName = fileUrl.split('/').pop(); // Extract the file name from the URL
      const downloadDest = `${folderPath}/${fileName}`; // Define the download destination

      const fileExists = await RNFS.exists(downloadDest);
      if (fileExists) {
        console.log(
          `File already exists at: ${downloadDest}, skipping download.`,
        );
        return; // Skip to the next file in the download list
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
          console.log(`Progress: ${progressPercent}%`);
        },
      };

      try {
        const result = await RNFS.downloadFile(options).promise;
        if (result.statusCode === 200) {
          console.log('File downloaded to:', downloadDest);
        } else {
          Alert.alert(
            'Failed',
            'File download failed videos, please restart tour',
          );
          console.log('Error:', result);
        }
      } catch (error) {
        console.log('Download error:', error);
      }
    });

    try {
      await Promise.all(downloadPromises); // Wait for all downloads to complete
      console.log('All files downloaded');
    } catch (error) {
      console.log('Error during downloads:', error);
      Alert.alert('Error', 'Some files could not be downloaded');
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        fetchDataCall();
      }}
      style={styles.container}
    >
      {isLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color={'#fff'} size="large" />
        </View>
      )}
      <ImageBackground
        source={
          item?.image_url
            ? { uri: item?.image_url }
            : require('../Asserts/location-image.png')
        }
        resizeMode="cover"
        style={styles.imageBackground}
      >
        <LinearGradient
          colors={['rgba(9,11,17,0.2)', '#0D1015']}
          style={styles.linearGradient}
        >
          {item?.duration !== null && item?.duration > 0 && (
            <View style={styles.pill}>
              <Image
                source={require('../Asserts/clock-icon.png')}
                style={{ marginTop: 1 }}
              />
              <Text style={styles.subtitle}>{TimeConvert(item?.duration)}</Text>
            </View>
          )}
          <Text style={styles.description}>{item?.description}</Text>
          <Text style={styles.title}>{item?.name}</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
};

function TimeConvert(n: any) {
  var num = n / 60;
  var hours = num / 60;
  var rhours = Math.floor(hours);
  var minutes = (hours - rhours) * 60;
  var rminutes = Math.round(minutes);
  return rhours + 'h ' + rminutes + 'm';
}

// define your styles
const styles = StyleSheet.create({
  container: {
    width: 260,
    height: 280,
    borderRadius: 20,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  linearGradient: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 14,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '400',
    color: COLOR.White,
    fontFamily: Font.Helvetica,
  },
  description: {
    color: COLOR.White,
    fontWeight: '400',
    lineHeight: 18,
    fontSize: 14,
  },
  subtitle: {
    color: COLOR.Primary,
    fontWeight: '700',
    lineHeight: 16,
    fontSize: 12,
  },
  pill: {
    backgroundColor: COLOR.Gray,
    paddingHorizontal: 15,
    flexDirection: 'row',
    paddingVertical: 9,
    borderRadius: 20,
    marginBottom: 10,
    gap: 6,
  },
});

//make this component available to the app
export default CardLocation;
