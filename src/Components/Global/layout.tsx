//import liraries
import React from 'react';
import { SafeAreaView, View } from 'react-native';
import Header from '../Header';

// create a component
const Layout = ({ children }: any) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Header />
        {children}
      </View>
    </SafeAreaView>
  );
};

//make this component available to the app
export default Layout;
