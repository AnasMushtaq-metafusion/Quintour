import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewScreen = () => {
  return (
    <WebView
      source={{
        uri: 'https://beta.quinbook.com/shopdemo/124?develop=Y&gamecode=XZAISL',
      }}
      style={{ flex: 1 }}
      startInLoadingState={true}
      renderLoading={Spinner}
    />
  );
};

export default WebViewScreen;

const Spinner = () => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      top: 0,
      left: 0,
      position: 'absolute',
    }}>
    <ActivityIndicator size="large" />
  </View>
);
