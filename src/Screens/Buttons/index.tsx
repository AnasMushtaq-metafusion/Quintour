import React, { useState } from 'react';
import { View, Button, Text, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

// Function to get permission for location
const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Geolocation Permission',
        message: 'Can we access your location?',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    console.log('granted', granted);
    if (granted === 'granted') {
      console.log('You can use Geolocation');
      return true;
    } else {
      console.log('You cannot use Geolocation');
      return false;
    }
  } catch (err) {
    return false;
  }
};

// Define your screen components
const Buttons = ({ navigation }: any) => {
  // state to hold location
  const [location, setLocation] = useState<any | null>(null);

  // function to check permissions and get Location
  const getLocation = () => {
    const result = requestLocationPermission();
    result.then(res => {
      console.log('res is:', res);
      if (res) {
        Geolocation.getCurrentPosition(
          position => {
            console.log(position);
            setLocation(position);
          },
          error => {
            // See error code charts below.
            console.log(error.code, error.message);
            setLocation(null);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
        );
      }
    });
    console.log(location);
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 20 }}>
      <Button
        title="Go to List View"
        onPress={() => navigation.navigate('welcome')}
      />
      <Button
        title="Go to Map View"
        onPress={() => navigation.navigate('map')}
      />
      <Button
        title="Go to Video View"
        onPress={() => navigation.navigate('video')}
      />
      <Button
        title="Go to Web View"
        onPress={() => navigation.navigate('webview')}
      />
      <Button title="Go to Web View" onPress={getLocation} />
      <Text>Latitude: {location ? location.coords.latitude : null}</Text>
      <Text>Longitude: {location ? location.coords.longitude : null}</Text>
    </View>
  );
};

export default Buttons;
