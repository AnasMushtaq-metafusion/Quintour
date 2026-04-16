//import liraries
import React, { useState } from 'react';
import { ImageBackground, TouchableOpacity } from 'react-native';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLOR, Font } from '../../Utils/variable';
import { useTranslation } from 'react-i18next';

// create a component
const Overlap = () => {
  const [show, setShow] = useState(false);
  const { t } = useTranslation(['tour']);

  function handleToggle(): void {
    // throw new Error('Function not implemented.');
    setShow(!show);
  }

  return (
    <>
      <View style={[styles.location, { opacity: show ? 1 : 0 }]}>
        <View style={styles.locationItem}>
          <Image source={require('../../Asserts/map-marker.png')} />
          <Text style={styles.locationText}>Rathausmarkt</Text>
        </View>
      </View>

      <View
        style={[
          styles.navigation,
          { left: show ? 0 : '-100%', opacity: show ? 1 : 0 },
        ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={styles.time}>00:04:42</Text>
          <TouchableOpacity onPress={() => handleToggle()}>
            <Image source={require('../../Asserts/backArrow.png')} />
          </TouchableOpacity>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
          <View style={styles.navigationBtns}>
            <View style={styles.navigationBtn}>
              <Text style={styles.navigationBtnText}>{t('tour:help')}</Text>
              <Text style={styles.navigationBtnNumber}>1</Text>
            </View>
            <View style={styles.navigationBtn}>
              <Text style={styles.navigationBtnText}>Score</Text>
              <Text style={styles.navigationBtnNumber}>150</Text>
            </View>
            <View style={styles.navigationBtn}>
              <Text style={styles.navigationBtnText}>Spot</Text>
              <Text style={styles.navigationBtnNumber}>1/20</Text>
            </View>
          </View>
          <View style={styles.hl}></View>
          <View style={styles.navigationIcons}>
            <TouchableOpacity>
              <Image
                source={require('../../Asserts/chat-icon.png')}
                style={{ height: 58 }}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image
                source={require('../../Asserts/help-icon.png')}
                style={{ height: 58 }}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image
                source={require('../../Asserts/photo-icon.png')}
                style={{ height: 58 }}
              />
            </TouchableOpacity>
            <TouchableOpacity style={{ position: 'relative', top: 2 }}>
              <Image
                source={require('../../Asserts/lamp-icon.png')}
                style={{ height: 58 }}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.navigationBtn}>
          <Text style={styles.navigationBtnNumber}>{t('tour:im_here')}</Text>
        </View>
      </View>

      <View style={[styles.timer, { opacity: show ? 0 : 1 }]}>
        <ImageBackground
          source={require('../../Asserts/timeBg.png')}
          resizeMode="cover"
          style={styles.timerInner}>
          <Text style={styles.timeCount}>00:04:42</Text>
        </ImageBackground>
        <TouchableOpacity onPress={() => handleToggle()} style={styles.timeBtn}>
          <Image source={require('../../Asserts/farwardArrow.png')} />
        </TouchableOpacity>
      </View>
    </>
  );
};

// define your styles
const styles = StyleSheet.create({
  location: {
    top: 30,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
    position: 'absolute',
    justifyContent: 'center',
  },
  locationItem: {
    gap: 12,
    padding: 12,
    borderRadius: 16,
    flexWrap: 'nowrap',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR.PurpleLight,
  },
  locationText: {
    fontSize: 24,
    color: COLOR.White,
    fontWeight: 'bold',
  },
  navigation: {
    backgroundColor: COLOR.PurpleLight,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    paddingVertical: 1,
    width: '100%',
    bottom: 0,
    zIndex: 1,
  },
  navigationBtns: {
    flexDirection: 'row',
    gap: 15,
  },
  navigationIcons: {
    flexDirection: 'row',
    gap: 0,
  },
  navigationBtn: {
    backgroundColor: COLOR.Purple,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  navigationBtnText: {
    fontSize: 18,
    color: COLOR.White,
    lineHeight: 29,
    fontWeight: '400',
    fontFamily: Font.Helvetica,
  },
  navigationBtnNumber: {
    fontSize: 24,
    color: COLOR.White,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: Font.HelveticaBold,
  },
  hl: {
    backgroundColor: COLOR.Border,
    marginLeft: 15,
    marginRight: 5,
    height: 45,
    width: 2,
  },
  time: {
    fontSize: 24,
    color: COLOR.White,
    lineHeight: 31,
    fontWeight: '700',
    fontFamily: Font.HelveticaBold,
  },
  timeCount: {
    fontSize: 24,
    color: COLOR.White,
    lineHeight: 64,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Font.HelveticaBold,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    zIndex: 1,
    right: 0,
    left: 0,
  },
  timerInner: {
    width: 140,
    height: 64,
  },
  timeBtn: {
    marginTop: 8,
  },
});

//make this component available to the app
export default Overlap;
