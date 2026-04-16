//import liraries
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLOR, Font } from '../../Utils/variable';
import { useTranslation } from 'react-i18next';

// create a component
const HeaderTransparent = () => {
  const { t } = useTranslation(['header']);

  return (
    <View style={styles.container}>
      <View style={{ width: 82 }}>
        <TouchableOpacity>
          <Image source={require('../../Asserts/hamburgerIcon.png')} />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* <Image
                    source={require('../../Asserts/appLogo.png')}
                /> */}
      </View>
      <TouchableOpacity style={styles.searchBtn}>
        <Image source={require('../../Asserts/searchIcon.png')} />
        <Text style={styles.searchText}>{t('header:search')}</Text>
      </TouchableOpacity>
    </View>
  );
};

// define your styles
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 4,
    position: 'absolute',
    minHeight: 75,
    zIndex: 1,
    left: 0,
    top: 0,
    width: '100%',
  },
  searchBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchText: {
    fontFamily: Font.HelveticaBold,
    fontWeight: '700',
    fontSize: 16,
    color: COLOR.White,
  },
});

//make this component available to the app
export default HeaderTransparent;
