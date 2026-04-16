//import liraries
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { _retrieveData } from '../../Snipets/Asyncstorage';

// create a component
const Welcome = ({ navigation }:any) => {
    const [token, setToken] = useState('Token');
    const [refresh, setRefresh] = useState('Refresh Token');

    useEffect(() => {
        (async () => {
            setToken(await _retrieveData("token"));
            setRefresh(await _retrieveData("refresh_token"));
        })();
    });    

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.para}>Token: {token}</Text>
            <Text style={styles.para}>Refresh Token: {refresh}</Text>
            <TouchableOpacity onPress={() => {navigation.navigate('map')}}>
                <Text style={styles.button}>Map</Text>
            </TouchableOpacity>
        </View>
    );
};

// define your styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15
    },
    title:{
        fontSize: 50,
        fontWeight: 'bold',
        marginBottom: 15
    },
    para:{
        fontSize: 16,
        marginBottom: 15
    },
    button:{
        backgroundColor: '#2196f3',
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontSize: 20,
        color: '#fff'
    }
});

//make this component available to the app
export default Welcome;
