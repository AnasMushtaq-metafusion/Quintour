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
} from 'react-native';
import { COLOR, Font } from '../../Utils/variable';
import LinearGradient from 'react-native-linear-gradient';
import LayoutTransparent from '../../Components/Global/layoutTransparent';
import { useTargetID } from '../../Snipets/GlobalContext';

import { useTranslation } from 'react-i18next';
import { useTimer } from '../../Snipets/TimeContext';
import {
  _getTourTargetNode,
  _isLockScreen,
  _removeData,
  _retrieveData,
} from '../../Snipets/Asyncstorage';

const LockScreen = ({ navigation }: any) => {
  const [number, onChangeNumber] = React.useState<number | null>(null);
  const [error, isError] = useState<string | null>(null);
  const { t } = useTranslation(['tour']);
  const { getTargetID } = useTargetID();
  const { statTimer } = useTimer();
  const [isFocusedTextInput, setIsFocusedTextInput] = useState<boolean>(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleUnlock = async () => {
    const code = (await _retrieveData('pinCode')) || 1234;

    if (number === code) {
      await _getTourTargetNode().then(async res => {
        if (res !== undefined) {
          _isLockScreen(false);
          fetchTourStartedData(res);
        } else {
          await _removeData('pinCode');
          navigation.replace('welcome');
        }
      });
    } else {
      isError('Please enter valid number, Eg:1234');
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

  const fetchTourStartedData = async (tourTarget: any) => {
    statTimer();
    getTargetID(tourTarget?.targetID);

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
      case 'audionode':
        navigation.replace('touraudio', {
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
      default:
        break;
    }
  };

  return (
    <LayoutTransparent>
      <View style={styles.fullScreen}>
        <LinearGradient
          colors={['#A659FE', '#6F53FD', '#A659FE']}
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
              <View style={styles.container}>
                <View style={{ marginTop: -47 }}>
                  <Image source={require('../../Asserts/finish_icon.png')} />
                </View>
                <TextInput
                  style={styles.input}
                  onChangeText={(text: string) => onChangeNumber(Number(text))}
                  value={number?.toString()}
                  placeholder={t('tour:enter_code')}
                  keyboardType="numeric"
                  onFocus={() => setIsFocusedTextInput(true)}
                  onBlur={() => setIsFocusedTextInput(false)}
                />
                {error && <Text style={styles.para}>{error}</Text>}
                <TouchableOpacity
                  onPress={() => handleUnlock()}
                  style={styles.buttonContainer}
                >
                  <Text style={styles.btnText}>Unlock Screen</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </LayoutTransparent>
  );
};

// define your styles
const styles = StyleSheet.create({
  btnText: {
    textAlign: 'center',
    fontFamily: Font.HelveticaBold,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonContainer: {
    backgroundColor: '#A659FE',
    width: '50%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    paddingBottom: 20,
    width: '100%',
    borderRadius: 20,
    backgroundColor: COLOR.White,
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
export default LockScreen;
