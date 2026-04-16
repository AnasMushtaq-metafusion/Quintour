import { useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { COLOR, Font } from '../Utils/variable';
import { useTranslation } from 'react-i18next';
import RenderHTML from 'react-native-render-html';
import { getHtmlConfig } from '../Utils/htmlRenderStyles';

const PictureDataPopup = ({ onClick, data }: any) => {
  const viewRef = useRef(null);
  const { t } = useTranslation(['tour']);
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.containerFixed, { top: 0 }]} ref={viewRef}>
      <View style={styles.containerOuter}>
        <View style={styles.container}>
          <ScrollView
            style={{
              minHeight: 200,
              width: '100%',
              maxHeight: 300,
            }}>
            <Text style={styles.heading}>{data?.label}</Text>

            <RenderHTML
              contentWidth={width}
              source={{ html: data?.text }}
              {...getHtmlConfig(18, 26)}
            />
          </ScrollView>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => {
              onClick();
            }}>
            <Text style={styles.buttonText}>{t('tour:further')}</Text>
          </TouchableOpacity>
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
  },
  confirmBtn: {
    backgroundColor: '#A659FE',
    width: '100%',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginTop: '5%',
  },
});

export default PictureDataPopup;
