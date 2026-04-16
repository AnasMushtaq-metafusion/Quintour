import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { COLOR } from '../../../Utils/variable';
import RNFS from 'react-native-fs';
import LayoutOverlay from '../../../Components/Global/layoutOverlay';
import { useTargetID } from '../../../Snipets/GlobalContext';

const TourVideoScreen = ({ navigation, route }: any) => {
  const { data, id, nodes, edges, itemMode, itemId, itemDuration } =
    route.params;

  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [load, isLoad] = React.useState(false);
  const [isBuffering, setIsBuffering] = React.useState(false);

  const source = edges.find((edge: any) => edge.source === id);
  const target = nodes.find((node: any) => node.id === source?.target);
  const { getTargetID, targetID } = useTargetID();

  // const onLoad = (data: any) => {
  //     setDuration(Math.floor(data.duration));
  //     isLoad(true);
  // };

  // const onProgress = (progress: any) => {
  //     const newCurrentTime = Math.floor(progress.currentTime);
  //     if (currentTime !== newCurrentTime) {
  //         setCurrentTime(newCurrentTime);
  //         isLoad(false);
  //     }
  // };

  const handlePlayPause = () => {
    setPaused(!paused);
  };

  const onEnd = () => {
    getTargetID(source?.target);
    switch (target?.type) {
      case 'videonode':
        navigation.navigate('tourvideo', {
          data: target?.data,
          id: target?.id,
          nodes: nodes,
          edges: edges,
          itemMode: itemMode,
          itemId: itemId,
          itemDuration: itemDuration,
        });
        break;
      case 'audionode':
        navigation.navigate('touraudio', {
          data: target?.data,
          id: target?.id,
          nodes: nodes,
          edges: edges,
          itemMode: itemMode,
          itemId: itemId,
          itemDuration: itemDuration,
        });
        break;
      case 'locationnode':
        navigation.navigate('tourmap', {
          data: target?.data,
          id: target?.id,
          nodes: nodes,
          edges: edges,
          itemMode: itemMode,
          itemId: itemId,
          itemDuration: itemDuration,
        });
        break;
      case 'webelementnode':
        navigation.navigate('tourwebview', {
          data: target?.data,
          id: target?.id,
          nodes: nodes,
          edges: edges,
          itemMode: itemMode,
          itemId: itemId,
          itemDuration: itemDuration,
        });
        break;
      case 'quiznode':
        navigation.navigate('tourquiz', {
          data: target?.data,
          id: target?.id,
          nodes: nodes,
          edges: edges,
          itemMode: itemMode,
          itemId: itemId,
          itemDuration: itemDuration,
        });
        break;
      case 'endgamenode':
        navigation.navigate('tourend', {
          itemMode: itemMode,
        });
        break;
      default:
        navigation.navigate('tourend', { itemMode: itemMode });
        break;
    }

    isLoad(false);
    setDuration(0);
    setCurrentTime(0);
  };

  // const onBuffer = (buffer: any) => {
  //     setIsBuffering(buffer.isBuffering);
  //     console.log(buffer.isBuffering);
  // };

  const fileName = data?.url?.split('/').pop();
  const folderPath = `${RNFS.DocumentDirectoryPath}/Quintour/Media/Videos/i_tour_${itemId}`;
  const videopath = folderPath ? `${folderPath}/${fileName}` : data?.url;
  console.log(currentTime, videopath);

  if (!data) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    targetID === id && (
      <LayoutOverlay data={data} itemDuration={itemDuration}>
        {itemMode && (
          <Text
            style={{
              textAlign: 'center',
              padding: 5,
              backgroundColor: COLOR.Blue,
              fontWeight: '700',
              color: COLOR.White,
            }}>
            TEST_MODE
          </Text>
        )}
        <View style={styles.container}>
          <View style={styles.progress}>
            <LinearGradient
              colors={['#5BAF98', '#A7D3C7', '#5BAF98']}
              style={{
                width: `${
                  currentTime ? ((currentTime * 1.03) / duration) * 100 : 0
                }%`,
                height: '100%',
              }}></LinearGradient>
          </View>
          <View style={styles.pause}>
            {load && (
              <TouchableOpacity onPress={handlePlayPause}>
                {paused ? (
                  <Image
                    source={require('../../../Asserts/play-icon.png')}
                    style={{ width: 30, height: 30 }}
                  />
                ) : (
                  <Image
                    source={require('../../../Asserts/pause-icon.png')}
                    style={{ width: 30, height: 30 }}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
          {data?.url ? (
            <>
              <Video
                source={{ uri: videopath }}
                style={styles.video}
                resizeMode="cover"
                paused={paused}
                onEnd={onEnd}
                // onLoad={onLoad}
                // onProgress={onProgress}
                // onBuffer={onBuffer}
              />
              {isBuffering && (
                <View style={styles.bufferingContainer}>
                  <ActivityIndicator size="large" color="#000" />
                </View>
              )}
            </>
          ) : (
            <View>
              <Text>No video found</Text>
              <TouchableOpacity onPress={() => onEnd()}>
                <Text style={styles.button}>Next step</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LayoutOverlay>
    )
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
  button: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 20,
    color: '#fff',
  },
  controls: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    height: 48,
    left: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  progress: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 5,
    zIndex: 1,
  },
  pause: {
    position: 'absolute',
    top: 15,
    right: 10,
    zIndex: 1,
  },
  bufferingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default TourVideoScreen;
