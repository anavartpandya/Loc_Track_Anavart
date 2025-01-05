import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/firebase-config'; // Your Firebase config file
import axios from 'axios'; // Import axios for API calls

const SERVER_URL = 'https://loc-track-anavart.onrender.com';
// const SERVER_URL = 'http://localhost:5000';

export default function LoginScreen() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '421473593256-04n9aa9evn78v6ojj225b8tdbi6ahmqd.apps.googleusercontent.com',
    scopes: ['openid', 'email', 'profile'],
  });

  const [email_user, setEmail] = useState('');
  const [password_user, setPassword] = useState('');
  const [showSignup, setShowSignup] = useState(false); // State to toggle Sign Up option

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      // Use Firebase to sign in with the Google token
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          console.log('User signed in with Google:', userCredential.user);
        })
        // .catch((error) => console.error('Error signing in with Google:', error.message));
    }
  }, [response]);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation regex
    return emailRegex.test(email);
  };
  

  const handleEmailLogin = async () => {
  
    if (!isValidEmail(email_user)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return; // Stop further execution
    }

    try {
      const payload = {
        email: email_user,
        password: password_user,
      };      
      // const payload = {
      //   email: "1223",
      //   password: "124",
      // };
      // console.log('Payload:', payload);
      const response = await axios.post(`${SERVER_URL}/login`, payload, {
        headers: {
          'Content-Type': 'application/json', // Explicitly set the content type
        },
      });
      // console.log('Response:', response.data);

      if (response.data.success) {
        console.log('User signed in with email:', response.data.user);
        Alert.alert('Success', 'Logged in successfully');
        setShowSignup(false); // Hide Sign Up option if login succeeds
      } else if (response.data.error === "missing_fields") {
        Alert.alert('Error', 'Email and password are required.');
        // setShowSignup(true); // Hide Sign Up option if login succeeds
      } else if (response.data.error === 'email_not_found') {
        Alert.alert('Error', 'Email not found. Please sign up.');
        setShowSignup(true); // Hide Sign Up option if login succeeds
      } else if (response.data.error === 'incorrect_password') {
        Alert.alert('Error', 'Incorrect password. Please try again.');
        setShowSignup(false); // Hide Sign Up option if login succeeds
      }
    } catch (error) {
      // console.error('Error signing in with email:', error);
      console.log('Response:', error);
      Alert.alert('Login Error', 'An error occurred. Please try again.');
    } finally {
      // Clear the input fields after login attempt
      setEmail('');
      setPassword('');
    }
  };

  const handleSignup = async () => {

    if (!isValidEmail(email_user)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return; // Stop further execution
    }
    
    try {
      const payload = {
        email: email_user,
        password: password_user,
      };
      const response = await axios.post(`${SERVER_URL}/signup`, payload, {
        headers: {
          'Content-Type': 'application/json', // Explicitly set the content type
        },
      });

      if (response.data.success) {
        Alert.alert('Success', 'Sign Up successful! Please log in.');
        setShowSignup(false); // Hide Sign Up option after successful sign-up
      } else {
        Alert.alert('Error', response.data.message || 'Sign Up failed. Please try again.');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      Alert.alert('Sign Up Error', 'An error occurred. Please try again.');
    } finally {
      // Clear the input fields after sign-up attempt
      setEmail('');
      setPassword('');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/google_icon_login.webp')} // Replace with your illustration
        style={styles.illustration}
      />
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      {/* Email and Password Login */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email_user}
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password_user}
        onChangeText={(text) => setPassword(text)}
      />
      <TouchableOpacity style={styles.emailButton} onPress={handleEmailLogin}>
        <Text style={styles.emailButtonText}>Login with Email</Text>
      </TouchableOpacity>

      {/* Conditionally render Sign Up button */}
      {showSignup && (
        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      )}

      {/* Google Login */}
      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Text style={styles.googleButtonText}>Login with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f9fc', // Light background
  },
  illustration: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    width: '80%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  emailButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  emailButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  signupButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 8,
    width: '80%',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
