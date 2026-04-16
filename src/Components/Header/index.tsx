// Import libraries
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { COLOR, Font } from '../../Utils/variable';
import { _removeData } from '../../Snipets/Asyncstorage';
import { useNavigation } from '@react-navigation/native';

import { NativeModules } from 'react-native';
import { useTranslation } from 'react-i18next';
const { Kiosk } = NativeModules;

// Create a component

const Header = () => {
  const { t } = useTranslation(['header']);

  const navigation = useNavigation();
  const [show, isShow] = React.useState<boolean>(false);

  const logout = async () => {
    await _removeData('token');
    await _removeData('refresh_token');
    isShow(!show);
    setTimeout(() => {
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }, 100);
  };

  const stopLockTask = () => {
    // To disable kiosk mode
    Kiosk.disableKioskMode((error: string | null, successMessage?: string) => {
      if (error) {
        console.error(error);
      } else {
        console.log(successMessage);
        isShow(!show);
        // Quitting the application
        Kiosk.quitApp((quitError: string | null, quitMessage?: string) => {
          if (quitError) {
            console.error(quitError);
          } else {
            console.log(quitMessage);
          }
        });
      }
    });
  };

  return (
    <>
      <View style={styles.container}>
        <View style={{ width: 82 }}>
          <TouchableOpacity onPress={() => isShow(!show)}>
            <Image source={require('../../Asserts/hamburgerIcon.png')} />
          </TouchableOpacity>
        </View>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          {/* <Image
                        source={require('../../Asserts/appLogo.png')}
                    /> */}
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Image source={require('../../Asserts/searchIcon.png')} />
          <Text style={styles.searchText}>{t('header:search')}</Text>
        </TouchableOpacity>
      </View>
      {show && (
        <View style={styles.drodpownMenu}>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Image source={require('../../Asserts/logout-icon.png')} />
            <Text style={styles.logoutBtnText}>{t('header:logout')}</Text>
          </TouchableOpacity>
          {Platform.OS === 'android' && (
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'android') {
                  stopLockTask();
                }
              }}
              style={styles.logoutBtn}
            >
              <Image source={require('../../Asserts/logout-icon.png')} />
              <Text style={styles.logoutBtnText}>{t('header:exit')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
};

// Define your styles
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLOR.Primary,
    paddingHorizontal: 24,
    minHeight: 75,
    paddingVertical: 4,
  },
  searchBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutBtn: {
    gap: 8,
    padding: 5,
    marginLeft: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  logoutBtnText: {
    color: COLOR.Primary,
  },
  searchText: {
    fontFamily: Font.HelveticaBold,
    fontWeight: '700',
    fontSize: 16,
    color: COLOR.White,
  },
  drodpownMenu: {
    position: 'absolute',
    top: 55,
    left: 25,
    width: 200,
    minHeight: 160,
    zIndex: 5,
    backgroundColor: COLOR.White,
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

// Make this component available to the app
export default Header;
