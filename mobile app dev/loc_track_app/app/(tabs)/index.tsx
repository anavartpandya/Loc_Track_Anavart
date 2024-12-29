import React, { useState, useEffect } from 'react';
import { StyleSheet, Platform, Image, Button, TextInput, View } from 'react-native';
import axios from 'axios';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Device from 'expo-device'; // Install this library: expo install expo-device
import * as Network from 'expo-network';

// import { HelloWave } from '@/components/HelloWave';
import { PinDrop } from '@/components/PinDrop';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Replace this with your actual Render server URL:
const SERVER_URL = 'https://loc-track-anavart.onrender.com';

export default function HomeScreen() {
  // 1) State variables
  const [serverMessage, setServerMessage] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 0,
    longitude: 0,
  });
  const [userName, setUserName] = useState<string>(''); // Store user name
  const [deviceId, setDeviceId] = useState<string>(''); // Store the generated device ID
  const [isEditing, setIsEditing] = useState<boolean>(false); // Toggle for editing user name

  // 2) (Optional) useEffect to do something on mount
  useEffect(() => {
    // If you want to automatically fetch instructions when screen loads:
    loadUserName();
    fetchServerInstructions();

    const intervalID = setInterval(() => {
      fetchServerInstructions() 
    }, 5000);

    return () => clearInterval(intervalID);
  }, []);

  const loadUserName = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
        setIsEditing(false);
      } else {
        setIsEditing(true); // Prompt for name if not stored
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  const saveUserName = async () => {
    try {
      await AsyncStorage.setItem('userName', userName);
      setIsEditing(false); // Stop editing mode after saving
    } catch (error) {
      console.error('Error saving user name:', error);
    }
  };

  // 3) Function to GET instructions from your Flask server
  const fetchServerInstructions = async () => {
    try {
      const { data } = await axios.get(`${SERVER_URL}/get_instructions`);
      // data might look like: { message: "Hello from server", requestLocation: true }
      setServerMessage(data.message ?? 'No message from server');
      if (data.requestLocation) {
        // handleSendLocation();
      }
    } catch (error) {
      // console.error('Error fetching instructions:', error);
      setServerMessage('Could not fetch instructions');
    }
  };

  // 4) Function to request and send location
  const handleSendLocation = async () => {
    setLocationStatus('Requesting permission...');
    // Ask for foreground location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationStatus('Permission to access location was denied');
      return;
    }

    // Get device location
    setLocationStatus('Retrieving location...');
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setCoords({ latitude, longitude });
    setLocationStatus('Location retrieved! Sending to server...');
  
    // Determine the deviceId based on platform and user name
    // Get unique device ID or name
    // const uniqueId = Device.deviceName || 'Unknown';
    // Get the local IP address
    const localIpAddress = await Network.getIpAddressAsync();    

    
    // Generate the device ID string
    const generatedDeviceId = `${localIpAddress} (${userName}'s ${
      Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android' : 'Device'
    })`;
    setDeviceId(generatedDeviceId);

    // The server expects { "Text": "{\"latitude\":..., \"longitude\":...}" }
    const payload = {
      Text: JSON.stringify({ latitude, longitude }),
      deviceId: generatedDeviceId,
      userName: userName,
    };

    try {
      const response = await axios.post(`${SERVER_URL}/update_location`, payload);
      // response.data might be: { status: "success", message: "Location updated!", ... }
      setServerMessage(response.data.message || 'Location sent successfully!');
      setLocationStatus('Location sent!');
    } catch (err) {
      console.error('Error sending location:', err);
      setLocationStatus('Error sending location');
    }
  };

  // 5) Render your existing ParallaxScrollView design, plus some new UI for location
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/location_track_logo.png')}
          style={styles.AppLogo}
        />
      }
    >
      {/* --- User Name Section --- */}
      <ThemedView style={styles.bodyContainer}>
        {isEditing ? (
          <View>
            <TextInput
              placeholder="Enter your name"
              value={userName}
              onChangeText={setUserName}
              style={{
                borderWidth: 1,
                padding: 8,
                margin: 16,
                borderRadius: 4,
              }}
            />
            <Button title="Save Name" onPress={saveUserName} />
          </View>
        ) : (
          <View>
            <ThemedText type="subtitle">Welcome, {userName}!</ThemedText>
            <Button title="Edit Name" onPress={() => setIsEditing(true)} />
          </View>
        )}
      </ThemedView>

      {/* --- Existing "Welcome!" UI --- */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Loc Track App</ThemedText>
        {/* <HelloWave /> */}
        <PinDrop />
      </ThemedView>

      {/* --- New UI for location tracking and server messages --- */}
      <ThemedView style={styles.bodyContainer}>
        <ThemedText type="subtitle">Server Message</ThemedText>
        <ThemedText>{serverMessage}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.bodyContainer}>
        <ThemedText type="subtitle">Location Status</ThemedText>
        <ThemedText>{locationStatus}</ThemedText>
        <ThemedText>
          Current Coords: {coords.latitude}, {coords.longitude}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.bodyContainer}>
        <Button title="Fetch Server Instructions" onPress={fetchServerInstructions} />
      </ThemedView>

      <ThemedView style={styles.bodyContainer}>
        <Button title="Send Location" onPress={handleSendLocation} />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom:30,
  },
  bodyContainer: {
    gap: 10,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  // AppLogo: {
  //   height: 200,
  //   width: 390,
  //   bottom: -40,
  //   left: 20,
  //   // position: 'absolute',
  // },
  AppLogo: {
    width: '90%',          // 90% of the container's width
    aspectRatio: 16 / 7.5,   // maintain a ~16:9 aspect ratio
    borderRadius: 16,      // rounded corners
    alignSelf: 'center',   // center horizontally
    marginVertical: 50,    // top/bottom spacing
    marginHorizontal: 50,
    // If using an <Image> component, control how the image fills this container:
    // resizeMode: 'cover'   // or 'contain', 'center' — pass as a prop to the Image component
  }
  
});
