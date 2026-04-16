//import liraries
import React from 'react';
import { SafeAreaView, View } from 'react-native';

// create a component
const LayoutTransparent = ({ children }: any) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* <HeaderTransparent /> */}
        {children}
      </View>
    </SafeAreaView>
  );
};

//make this component available to the app
export default LayoutTransparent;
