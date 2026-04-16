//import liraries
import React, { useEffect, useState } from 'react';
import {
  View,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { _isLockScreen, _retrieveData } from '../../Snipets/Asyncstorage';
import Layout from '../../Components/Global/layout';
import { COLOR, PROD_BASE_URL } from '../../Utils/variable';
import CardLocation from '../../Snipets/cardLocation';
import useFirebaseCloudMessaging from '../../Snipets/UseFirebaseCloudMessaging';
import useBackgroundWorker from '../../Snipets/UseBackgroundWorker';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { useGlobal, useTourRunID } from '../../Snipets/GlobalContext';
import { analyzePictureByAi, sendPictureToServer } from '../../Snipets/helpers';
import * as Sentry from '@sentry/react-native';

// create a component
const Welcome = ({ navigation, route }: any) => {
  useFirebaseCloudMessaging();
  useBackgroundWorker();

  const [dataSource, setDataSource] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { getTourRunID } = useTourRunID();
  const {
    setPicturesMetaData,
    analyzePicturesArray,
    picturesMetaData,
    setAnalyzePicturesArray,
  } = useGlobal();

  const fetchData = async (data: any) => {
    const myHeaders = new Headers();
    myHeaders.append('Authorization', `Bearer ${data}`);
    myHeaders.append('Cookie', 'SERVERID=webserver4');

    const requestOptions: any = {
      method: 'GET',
      headers: myHeaders,
    };

    try {
      const response = await fetch(`${PROD_BASE_URL}/tours`, requestOptions);

      if (response.status === 401) {
        // Handle unauthorized - token may be expired
        console.log('Unauthorized: Token may be expired');
        Sentry.captureException(
          new Error('401 Unauthorized on tours endpoint'),
        );
        setDataSource([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setDataSource(result);
    } catch (error) {
      console.log('error', error);
      Sentry.captureException(error); // <-- send to Sentry
      setDataSource([]);
    }
  };

  useEffect(() => {
    (async () => {
      const token = await _retrieveData('token');
      if (token) {
        getTourRunID(0);
        fetchData(token);
      } else {
        console.log('No token found, skipping API call');
        setDataSource([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadPictures = async () => {
    await picturesMetaData.forEach((data: any) => {
      sendPictureToServer(data.picture, data.i_tour, data.tourRunID);
    });

    await analyzePicturesArray.forEach((data: any) => {
      analyzePictureByAi(
        data.picture,
        data.i_tour,
        data.tourRunID,
        data.analyseData,
        'node_picture',
      );
    });

    setPicturesMetaData([]);
    setAnalyzePicturesArray([]);
  };

  useEffect(() => {
    if (route?.params?.uploadPics) {
      uploadPictures();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.uploadPics]);

  const onRefresh = async () => {
    setRefreshing(true);
    const token = await _retrieveData('token');
    if (token) {
      await fetchData(token);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    const messagingInstance = getMessaging();

    const unsubscribe = onMessage(
      messagingInstance,
      async (remoteMessage: any) => {
        if (remoteMessage.data?.todo === 'rmt_lock_screen') {
          _isLockScreen(true);
          navigation.replace('lockscreen', { itemMode: 'item' });
        }
      },
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!dataSource.length) {
    return (
      <View style={styles.container}>
        <View style={styles.containerIndicator}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </View>
    );
  }

  return (
    <Layout navigation={navigation}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.cardsContainer}>
            {dataSource?.map((item, index) => (
              <CardLocation item={item} navigation={navigation} key={index} />
            ))}
          </View>
        </ScrollView>
      </View>
    </Layout>
  );
};

// define your styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR.Primary,
    width: '100%',
    alignItems: 'center',
  },

  containerIndicator: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.Primary,
  },
  cardsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  scrollContainer: { width: '95%' },
});

//make this component available to the app
export default Welcome;
