import { useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { COLOR, Font } from '../Utils/variable';
import RenderHTML from 'react-native-render-html';
import { getHtmlConfig } from '../Utils/htmlRenderStyles';

const PictureTextPopup = ({ data }: any) => {
  const viewRef = useRef(null);
  const { width } = useWindowDimensions();

  return (
    <View style={styles.containerFixed} ref={viewRef}>
      <View style={styles.container}>
        <ScrollView>
          <Text style={styles.heading}>{data?.label}</Text>

          <RenderHTML
            contentWidth={width}
            source={{ html: data?.text }}
            {...getHtmlConfig(16, 24)}
          />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerFixed: {
    zIndex: 3,
    position: 'absolute',
    bottom: 1000,
    right: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: '50%',
  },

  container: {
    backgroundColor: COLOR.White,
    borderRadius: 20,
    padding: 10,
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
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Font.Helvetica,
  },
});

export default PictureTextPopup;
