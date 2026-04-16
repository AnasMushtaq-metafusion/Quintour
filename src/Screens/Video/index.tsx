import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import Video from 'react-native-video';

const VideoScreen = ({ navigation }: any) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [navigation]);

  const onEnd = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require('../../Asserts/video/dummy-video.mp4')}
        style={styles.video}
        // autoplay={true}
        onEnd={onEnd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%', // Add this line to make the video fill the entire container
  },
});

export default VideoScreen;
