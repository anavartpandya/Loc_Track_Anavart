import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Platform, Image, TextInput, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
// import { VStack, Box, Button, Input, Card, Heading, Text, useToast, Icon } from 'native-base';
import axios from 'axios';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Device from 'expo-device'; // Install this library: expo install expo-device
import * as Network from 'expo-network';
import { MaterialIcons } from '@expo/vector-icons';


// import { HelloWave } from '@/components/HelloWave';
import { PinDrop } from '@/components/PinDrop';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import * as Notifications from 'expo-notifications';
import { Icon } from 'native-base';
// import Constants from 'expo-constants';

// Replace this with your actual Render server URL:
const SERVER_URL = 'https://loc-track-anavart.onrender.com';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Function to send a notification
const sendNotification = async (message: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Server Message',
      body: message,
      sound: 'default',
      // sound: 'funny_notif.mp3',
    },
    trigger: null, // Send immediately
  });
};

export default function HomeScreen() {
  // 1) State variables
  const [serverMessage, setServerMessage] = useState<string>('');
  const [Rating, setRating] = useState<number>(0);
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
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Notification permissions not granted');
      }
    };
    // const requestPermissions = async () => {
    //   const settings = await Notifications.requestPermissionsAsync();
    //   if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    //     console.log('Notification permissions granted.');
    //   } else {
    //     console.log('Notification permissions not granted.');
    //   }
    // };

    requestPermissions();
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
      setRating(response.data.Rating || 0);
      setLocationStatus('Location sent!');

      // Trigger a notification with the server message
      sendNotification(response.data.message);

    } catch (err) {
      console.error('Error sending location:', err);
      setLocationStatus('Error sending location');
    }
  };

  // 5) Render your existing ParallaxScrollView design, plus some new UI for location
//   return (
//     <View style={styles.container}>
//       <Image
//         source={require('@/assets/images/location_track_logo.png')}
//         style={styles.logo}
//       />
//       {isEditing ? (
//         <View style={styles.userNameInputContainer}>
//           <TextInput
//             style={styles.input}
//             placeholder="Enter your name"
//             value={userName}
//             onChangeText={setUserName}
//           />
//           <TouchableOpacity style={styles.saveButton} onPress={saveUserName}>
//             <ThemedText style={styles.saveButtonText}>Save Name</ThemedText>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <ThemedText style={styles.greetingText}>Welcome, {userName}!</ThemedText>
//       )}

//       <ThemedText style={styles.serverMessage}>Server Message: {serverMessage}</ThemedText>

//       <TouchableOpacity style={styles.locationButton} onPress={handleSendLocation}>
//         <ThemedText style={styles.locationButtonText}>Send Location</ThemedText>
//       </TouchableOpacity>

//       <View style={styles.locationStatus}>
//         <ThemedText style={styles.locationStatus}>Location Status: {locationStatus}</ThemedText>
//         <ThemedText style={styles.locationStatus}>
//           Coords: {coords.latitude}, {coords.longitude}
//         </ThemedText>
//       </View>
//     </View>
//   );
// }
// //     <ParallaxScrollView
// //       headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
// //       headerImage={
// //         <Image
// //           source={require('@/assets/images/location_track_logo.png')}
// //           style={styles.AppLogo}
// //         />
// //       }
// //     >
// //       {/* --- User Name Section --- */}
// //       <ThemedView style={styles.bodyContainer}>
// //         {isEditing ? (
// //           <View>
// //             <TextInput
// //               placeholder="Enter your name"
// //               value={userName}
// //               onChangeText={setUserName}
// //               style={{
// //                 borderWidth: 1,
// //                 padding: 8,
// //                 margin: 16,
// //                 borderRadius: 4,
// //               }}
// //             />
// //             <Button title="Save Name" onPress={saveUserName} />
// //           </View>
// //         ) : (
// //           <View>
// //             <ThemedText type="subtitle">Welcome, {userName}!</ThemedText>
// //             {/* <ThemedText type="subtitle">તમારું સ્વાગત છે {userName}!</ThemedText> */}
// //             <Button title="Edit Name" onPress={() => setIsEditing(true)} />
// //           </View>
// //         )}
// //       </ThemedView>

// //       {/* --- Existing "Welcome!" UI --- */}
// //       <ThemedView style={styles.titleContainer}>
// //         <ThemedText type="title">Loc Track App</ThemedText>
// //         {/* <HelloWave /> */}
// //         <PinDrop />
// //       </ThemedView>

// //       {/* --- New UI for location tracking and server messages --- */}
// //       <ThemedView style={styles.bodyContainer}>
// //         <ThemedText type="subtitle">Server Message</ThemedText>
// //         <ThemedText>{serverMessage}</ThemedText>
// //       </ThemedView>

// //       <ThemedView style={styles.bodyContainer}>
// //         <ThemedText type="subtitle">Location Status</ThemedText>
// //         <ThemedText>{locationStatus}</ThemedText>
// //         <ThemedText>
// //           Current Coords: {coords.latitude}, {coords.longitude}
// //         </ThemedText>
// //       </ThemedView>

// //       {/* <ThemedView style={styles.bodyContainer}>
// //         <Button title="Fetch Server Instructions" onPress={fetchServerInstructions} />
// //       </ThemedView> */}

// //       <ThemedView style={styles.bodyContainer}>
// //         <Button title="Send Location" onPress={handleSendLocation} />
// //       </ThemedView>
// //     </ParallaxScrollView>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   titleContainer: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 8,
// //     paddingBottom:30,
// //   },
// //   bodyContainer: {
// //     gap: 10,
// //     marginBottom: 16,
// //     marginHorizontal: 16,
// //   },
// //   // AppLogo: {
// //   //   height: 200,
// //   //   width: 390,
// //   //   bottom: -40,
// //   //   left: 20,
// //   //   // position: 'absolute',
// //   // },
// //   AppLogo: {
// //     width: '90%',          // 90% of the container's width
// //     aspectRatio: 16 / 7.5,   // maintain a ~16:9 aspect ratio
// //     borderRadius: 16,      // rounded corners
// //     alignSelf: 'center',   // center horizontally
// //     marginVertical: 50,    // top/bottom spacing
// //     marginHorizontal: 50,
// //     // If using an <Image> component, control how the image fills this container:
// //     // resizeMode: 'cover'   // or 'contain', 'center' — pass as a prop to the Image component
// //   }
  
// // });

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F7F9FC',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 20,
//   },
//   logo: {
//     width: 150,
//     height: 150,
//     marginBottom: 30,
//     borderRadius: 75,
//   },
//   userNameInputContainer: {
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   input: {
//     width: '80%',
//     padding: 10,
//     borderWidth: 1,
//     borderColor: '#CCC',
//     borderRadius: 8,
//     marginBottom: 10,
//     backgroundColor: '#FFF',
//   },
//   saveButton: {
//     backgroundColor: '#007BFF',
//     padding: 10,
//     borderRadius: 8,
//     alignItems: 'center',
//     width: '60%',
//   },
//   saveButtonText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   greetingText: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     color: '#333',
//   },
//   serverMessage: {
//     fontSize: 16,
//     marginVertical: 10,
//     color: '#555',
//   },
//   locationButton: {
//     backgroundColor: '#28A745',
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     width: '60%',
//     marginBottom: 20,
//   },
//   locationButtonText: {
//     color: '#FFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   locationStatus: {
//     marginTop: 20,
//     alignItems: 'center',
//     color: "#555"
//   },
// });



return (
  <SafeAreaView style={styles.container}>
    {/* Header */}
    <View style={styles.header}>
      <View style={styles.logo_container}>
        <Image
          source={require('@/assets/images/location_track_logo.png')}
          style={styles.logo}
        />
      </View>
      <Text style={styles.appName}>Moksh</Text>
      <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editIcon}>
        <MaterialIcons name="menu" size={34} color="000" />
      </TouchableOpacity>
    </View>

    {/* Edit Name Section */}
    {isEditing && (
      <View style={styles.editSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={userName}
          onChangeText={setUserName}
        />
        <TouchableOpacity style={styles.saveButton} onPress={saveUserName}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    )}

    {/* Welcome Section */}
    <Text style={styles.welcomeText}>Jay Swaminarayan, {userName || 'Guest'} Bhagat!</Text>

    <View style={styles.container}>
      {/* Rating Bar */}
      <View style={styles.barContainer}>
        <View style={[styles.filledBar, { flex: Rating / 100 }]}>
        <Text style={styles.ratingText}>{Rating}%</Text>
        </View>
        <View style={[styles.emptyBar, { flex: (100 - Rating) / 100 }]}>
        {/* <Text style={styles.ratingText}>{Rating}%</Text> */}
        </View>
      </View>
    </View>

    {/* Main Content */}
    <View style={styles.mainContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Server Message</Text>
        <Text style={styles.cardText}>{serverMessage}</Text>
        <Text style={styles.cardText}>
          {"\n\n"}
          Coords: {coords.latitude.toFixed(2)}, {coords.longitude.toFixed(2)}
          {"\n"}
        </Text>
      </View>
      {/* <View style={styles.card}>
        <Text style={styles.cardTitle}>Location Status</Text>
        <Text style={styles.cardText}>Status: {locationStatus}</Text>
        <Text style={styles.cardText}>
          Coords: {coords.latitude.toFixed(2)}, {coords.longitude.toFixed(2)}
        </Text>
      </View> */}
    </View>

    {/* Send Location Button */}
    <TouchableOpacity style={styles.sendLocationButton} onPress={handleSendLocation}>
      <Text style={styles.sendLocationText}>Send Location</Text>
    </TouchableOpacity>
  // </SafeAreaView>
);
}
const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#f7eada',
  paddingHorizontal: Platform.OS === 'ios' ? 20 : 20,
},
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingHorizontal: Platform.OS === 'ios' ? 2 : 2,
  marginTop: Platform.OS === 'ios' ? height*0.01 : height*0.05, // Adjust for safe area (iOS Dynamic Island)
  marginBottom: Platform.OS === 'ios' ? height*0.01 : height*0.01, // Adjust for safe area (iOS Dynamic Island)
},
logo_container: {
  width: width*0.1,
  height: width*0.1,
  marginHorizontal: Platform.OS === 'ios' ? width*0.02 : width*0.0,
  borderRadius: 40,
},
logo: {
  width: width*0.1,
  height: width*0.1,
  marginHorizontal: Platform.OS === 'ios' ? width*0.02 : width*0.0,
},
appName: {
  fontSize: 28,
  alignContent: 'flex-start',
  fontWeight: 'bold',
  fontFamily: 'serif',
  textAlign: 'left',
  paddingStart: width*0.03,
  color: '#28A745',
},
editIcon: {
  padding: 8,
  borderRadius: 2,
  backgroundColor: '#f7eada',
  alignSelf: 'center',
  alignItems: 'center',
  marginHorizontal: Platform.OS === 'ios' ? width*0.45 : width*0.4,
},
editText: {
  fontSize: 20,
  color: '#555',
},
editSection: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: Platform.OS === 'ios' ? height*0.01 : height*0.01,
  // marginBottom: Platform.OS === 'ios' ? height*0.1 : height*0.05,
  marginHorizontal: Platform.OS === 'ios' ? width*0.1 : width*0.05,
},
input: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#CCC',
  borderRadius: 8,
  padding: 12,
  marginRight: 10,
  fontSize: 16,
},
saveButton: {
  backgroundColor: '#28A745',
  padding: 10,
  borderRadius: 8,
},
saveButtonText: {
  color: '#FFF',
  fontWeight: 'bold',
},
welcomeText: {
  fontSize: 22,
  fontWeight: '600',
  textAlign: 'center',
  fontFamily: 'serif',
  marginBottom: 20,
  color: '#333',
},
barContainer: {
  width: width*0.3,
  height: height*0.3, // Total height of the bar
  backgroundColor: '#e0e0e0',
  borderRadius: 10,
  overflow: 'hidden',
  flexDirection: 'column-reverse', // Fill from bottom to top
  justifyContent: 'center', // Center content vertically
  alignItems: 'center', // Center content horizontally  
  alignSelf: 'center',
},
filledBar: {
  backgroundColor: '#28A745', // Green for the filled part
  // borderTopLeftRadius: 10,
  // borderTopRightRadius: 10,
  justifyContent: 'center', // Center content vertically
  alignItems: 'center', // Center content horizontally 
  width: width*0.3,
  // marginBottom: width*0.05,
},
emptyBar: {
  // borderTopLeftRadius: 10,
  // borderTopRightRadius: 10,  
  backgroundColor: '#f7f7f7', // Light gray for the unfilled part
  justifyContent: 'center', // Center content vertically
  alignItems: 'center', // Center content horizontally  
  width: width*0.3,
},
ratingText: {
  // position: 'absolute',
  fontSize: 10,
  fontWeight: 'bold',
  alignItems: 'center',
  // marginTop: width*0.01,
  // textAlignVertical: 'center',
  textAlign: 'center',
  // color: '#333',
  color: '#FFF',

},
mainContent: {
  flex: 1,
  justifyContent: 'space-around',
  marginBottom: -width*0,
  paddingTop: height*0.,
},
card: {
  padding: 20,
  height: 200,
  borderRadius: 20,
  backgroundColor: '#FFF',
  elevation: 5,
  marginHorizontal: Platform.OS === 'ios' ? width*0.1 : width*0.05,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
},
cardTitle: {
  fontSize: 20,
  fontFamily: 'serif',
  fontWeight: 'bold',
  marginBottom: 10,
  textAlign: 'center',
  color: '#555',
},
cardText: {
  fontSize: 16,
  fontFamily: 'serif',
  color: '#555',
  textAlign: 'center',
},
sendLocationButton: {
  backgroundColor: '#28A745',
  padding: 15,
  borderRadius: 10,
  alignItems: 'center',
  marginHorizontal: Platform.OS === 'ios' ? width*0.25 : width*0.2,
  marginBottom: Platform.OS === 'ios' ? height*0.1 : height*0.05, // Adjust for safe area
},
sendLocationText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#FFF',
},
});