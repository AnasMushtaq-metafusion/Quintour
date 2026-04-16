// FullScreenImage.js
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { COLOR } from '../Utils/variable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import MagnifyingGlassIcon from '../Asserts/svg/MagnifyingGlassIcon.svg';

const FullScreenImage = ({ imageUri, imageFull }: any) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [orientation, setOrientation] = React.useState('portrait');

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const determineOrientation = ({ window }: { window: any }) => {
    if (window.height > window.width) {
      setOrientation('portrait');
    } else {
      setOrientation('landscape');
    }
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      determineOrientation,
    );

    // Set initial orientation
    determineOrientation({ window: Dimensions.get('window') });

    // Clean up listener on unmount
    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      {imageUri && (
        <TouchableOpacity onPress={openModal}>
          <Image
            source={{ uri: imageUri }}
            resizeMode="stretch"
            style={{
              width: '100%',
              marginBottom: orientation === 'landscape' ? '-4%' : '-9.9%',
              height: 200,
            }}
          />
          <View style={styles.zoomIcon}>
            <MagnifyingGlassIcon />
          </View>
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        style={styles.modal}>
        <GestureHandlerRootView>
          <View style={styles.fullScreenImageContainer}>
            {imageFull ? (
              <ImageZoom
                uri={imageFull}
                style={styles.fullScreenImage}
                isDoubleTapEnabled
              />
            ) : (
              <ActivityIndicator size="large" color="#fff" />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Image source={require('../Asserts/close_btn.png')} />
            </TouchableOpacity>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 40,
    zIndex: 1,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  thumbnail: {
    width: '100%',
    height: 150,
    // aspectRatio: 16 / 9, // 16:9 aspect ratio
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.Primary,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 0,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // borderRadius: 20,
  },
  zoomIcon: {
    position: 'absolute',
    bottom: -10,
    left: 10,
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FullScreenImage;
