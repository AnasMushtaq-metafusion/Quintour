import { useRef } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLOR, Font } from '../Utils/variable';
import { useTranslation } from 'react-i18next';

const ConfirmPopup = ({
  onClick,
  heading,
  subHeading,
  onCancel,
  layoutImage,
}: any) => {
  const { t } = useTranslation(['common']);
  // console.log(tips);
  const viewRef = useRef(null);
  const windowHeight = Dimensions.get('window').height;

  return (
    <View style={[styles.containerFixed, { top: 0 }]} ref={viewRef}>
      <View style={styles.containerOuter}>
        <View style={styles.container}>
          <ScrollView
            endFillColor={COLOR.Purple}
            style={{
              maxHeight: windowHeight - 300,
              marginBottom: 15,
              width: '100%',
            }}>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.subHeading}>{subHeading}</Text>
          </ScrollView>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: layoutImage?.foregroundBtnColor
                    ? layoutImage?.foregroundBtnColor
                    : '#A659FE',
                },
              ]}
              onPress={onCancel}>
              <Text
                style={{
                  ...styles.buttonText,
                  color: layoutImage?.foregroundBtnTextColor
                    ? layoutImage?.foregroundBtnTextColor
                    : '#fff',
                  textTransform: 'capitalize',
                }}>
                {t('common:no')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: layoutImage?.foregroundBtnColor
                    ? layoutImage?.foregroundBtnColor
                    : '#A659FE',
                },
              ]}
              onPress={onClick}>
              <Text
                style={{
                  ...styles.buttonText,
                  color: layoutImage?.foregroundBtnTextColor
                    ? layoutImage?.foregroundBtnTextColor
                    : '#fff',
                  textTransform: 'capitalize',
                }}>
                {t('common:yes')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 50,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Font.HelveticaBold,
    letterSpacing: 0.5,
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
    color: COLOR.Primary,
    fontWeight: '700',
    fontSize: 28,
    fontFamily: Font.HelveticaBold,
    textAlign: 'center',
    marginBottom: '2%',
  },
  subHeading: {
    color: COLOR.Primary,
    fontWeight: '400',
    fontSize: 20,
    fontFamily: Font.Helvetica,
    textAlign: 'center',
  },
  font: { fontWeight: '500' },
});

export default ConfirmPopup;
