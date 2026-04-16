import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLOR, Font } from '../Utils/variable';
import { useTranslation } from 'react-i18next';

const PictureConfirmationPopup = ({
  onClick,
  onCancel,
  isSuccess,
  isLoading,
  runTourData,
  image,
  infoText,
}: any) => {
  const viewRef = useRef(null);
  const { t } = useTranslation(['tour', 'common']);

  const progressInput = useRef(new Animated.Value(0)).current;

  const progressWidthInput = progressInput.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  useEffect(() => {
    if (isSuccess === true) {
      progressInput.setValue(0); // ✅ reset the raw value
      Animated.timing(progressInput, {
        toValue: 1, // ✅ this drives the interpolation
        duration: 1500,
        useNativeDriver: false, // width can't use native driver
      }).start(() => {
        runTourData();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  return (
    <View style={[styles.containerFixed, { top: 0 }]} ref={viewRef}>
      <View style={styles.containerOuter}>
        <View style={styles.container}>
          <ScrollView
            style={{
              minHeight: 200,
              width: '100%',
              maxHeight: 300,
            }}
          >
            <Text style={styles.heading}>{t('tour:photo_task')}</Text>
            <Text style={styles.title}>{t('tour:use_photo_text')}</Text>
            {infoText !== '' && <Text style={styles.infoText}>{infoText}</Text>}
            <Image
              source={{ uri: image.uri }}
              style={styles.image}
              alt="img"
              resizeMode="contain"
            />
          </ScrollView>
          <View style={styles.btnsContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                onCancel();
              }}
            >
              <Text style={styles.submitBtnText}>{t('common:again')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor:
                    isSuccess === true
                      ? COLOR.Green
                      : isSuccess === false
                      ? COLOR.Red
                      : '#FFF',
                },
              ]}
              onPress={() => {
                if (isSuccess === false) {
                  runTourData();
                } else {
                  onClick();
                }
              }}
            >
              {isLoading ? (
                <ActivityIndicator />
              ) : (
                <Text
                  style={[
                    styles.submitBtnText,

                    {
                      color:
                        isSuccess === true
                          ? COLOR.White
                          : isSuccess === false
                          ? COLOR.Primary
                          : '#000',
                    },
                  ]}
                >
                  {isSuccess === false ? t('tour:further') : t('tour:confirm')}
                </Text>
              )}
              {isSuccess !== '' && (
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      width: progressWidthInput, // This is now a string: '0%' to '100%'
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  btn: {
    height: 50,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
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

  heading: {
    fontSize: 28,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Font.HelveticaBold,
    color: '#000',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Font.Helvetica,
    color: '#000',
  },

  infoText: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Font.Helvetica,
    color: '#000',
  },
  button: {
    backgroundColor: '#FFF',
    width: '45%',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1.4,
    elevation: 10,
  },
  submitBtn: {
    width: '45%',
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 1.4,
    elevation: 10,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLOR.Primary,
    position: 'relative',
    fontFamily: Font.HelveticaBold,
  },
  bar: {
    position: 'absolute',
    height: '100%',
    zIndex: 1,
    top: 0,
    left: 0,
    borderRadius: 20,
  },
  btnsContainer: {
    flexDirection: 'row',
    gap: 10,
  },

  image: {
    width: '100%',
    height: 120,
    borderRadius: 20,
    marginBottom: 20,
  },
});

export default PictureConfirmationPopup;
