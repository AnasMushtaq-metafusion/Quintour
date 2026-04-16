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
import { COLOR } from '../Utils/variable';

const TestModePopup = ({
  onClick,
  handleNextScreen,
  handleLastScreen,
  handleSuccess,
  handleFailure,
}: any) => {
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
            <View style={styles.helpCard}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: COLOR.Blue }]}
                onPress={() => {
                  handleNextScreen();
                  onClick();
                }}>
                <Text style={styles.font}>Next Screen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: COLOR.Gray }]}
                onPress={() => {
                  handleLastScreen();
                  onClick();
                }}>
                <Text style={styles.font}>Last screen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: COLOR.Green }]}
                onPress={() => {
                  handleSuccess();
                  onClick();
                }}>
                <Text style={styles.font}>Success</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: COLOR.Red }]}
                onPress={() => {
                  handleFailure();
                  onClick();
                }}>
                <Text style={styles.font}>Failure</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <TouchableOpacity
            style={{ width: '100%' }}
            onPress={() => {
              onClick();
            }}>
            <Image
              style={{ width: '100%' }}
              resizeMode="contain"
              source={require('../Asserts/help_btn.png')}
            />
          </TouchableOpacity>
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

  helpCard: {
    borderColor: COLOR.BorderHelp,
    borderStyle: 'solid',
    position: 'relative',
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 15,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  font: { fontWeight: '500' },
});

export default TestModePopup;
