import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/firebase-config'; // Your Firebase config file
import axios from 'axios'; // Import axios for API calls
import { MaterialIcons } from '@expo/vector-icons'; // Ensure you have the vector-icons library installed

import AccountsScreen from '../accounts'; // Import the Accounts page

const SERVER_URL = 'https://loc-track-anavart.onrender.com';
// const SERVER_URL = 'http://localhost:5000';

export default function LoginScreen() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '421473593256-04n9aa9evn78v6ojj225b8tdbi6ahmqd.apps.googleusercontent.com',
    scopes: ['openid', 'email', 'profile'],
  });

  const [email_user, setEmail] = useState('');
  const [password_user, setPassword] = useState('');
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [showSignup, setShowSignup] = useState(false); // State to toggle Sign Up option
  const [showLogin, setShowLogin] = useState(true); // State to toggle Sign Up option
  const [showEmailInput, setEmailInput] = useState(true); // State to toggle Sign Up option
  const [showOtpInput, setOtpInput] = useState(false); // State to toggle Sign Up option
  const [verificationCode, setVerificationCode] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false); // Toggle for verification step
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array to store each digit
  const inputs = useRef<(TextInput | null)[]>([]);

  const [isLoggedIn, setIsLoggedIn] = useState(false); // Manage login state

  const handleLoginSuccess = () => {
    setIsLoggedIn(true); // Set user as logged in
  };

  const handleLogout = () => {
    setIsLoggedIn(false); // Set user as logged out
  };

  // if (isLoggedIn) {
  //   return <AccountsScreen onLogout={handleLogout} />;
  // }


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
    console.log('LoginScreen mounted or updated');
  }, [response]);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation regex
    return emailRegex.test(email);
  };

  const handleChangeText = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text; // Update the corresponding digit
    setOtp(newOtp);
  
    // Move focus to the next input box if text is entered
    if (text && index < 5 && inputs.current[index + 1]) {
      (inputs.current[index + 1] as TextInput).focus();
    }
  
    // Handle backspace and move focus to the previous input
    if (!text && index > 0 && inputs.current[index - 1]) {
      (inputs.current[index - 1] as TextInput).focus();
    }
    
  // When OTP is complete (all 6 digits entered), process it
  if (newOtp.every((digit) => digit !== '')) {
    const enteredOtp = newOtp.join(''); // Join the array into a single string
    const otpNumber = parseInt(enteredOtp, 10); // Convert the string into a number

    setVerificationCode(otpNumber);

    // // Perform action with the OTP number
    // if (!isNaN(otpNumber) && enteredOtp.length === 6) {
    //   setVerificationCode(otpNumber);
    //   // Alert.alert('OTP Submitted', `Your verification code is: ${verificationCode}`);
    //   // Alert.alert('OTP Submitted', `Your OTP is: ${otpNumber}`);
    // }
  }

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
        handleLoginSuccess(); // Transition to AccountsScreen
      } else if (response.data.error === "missing_fields") {
        Alert.alert('Error', 'Email and password are required.');
        // setShowSignup(true); // Hide Sign Up option if login succeeds
      } else if (response.data.error === 'email_not_found') {
        Alert.alert('Error', 'Email not found. Please sign up.');
        setShowSignup(true); // Hide Sign Up option if login succeeds
        setShowLogin(false);
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
        Alert.alert('Success', 'Verification email sent. Please check your email.');
        // Alert.alert('Success', 'Sign Up successful! Please log in.');
        setIsVerifying(true); // Move to verification step
        setOtpInput(true);
        setShowLogin(false);
        setShowSignup(false); // Hide Sign Up option after successful sign-up
        setEmailInput(false);
      } else {
        Alert.alert('Error', response.data.message || 'Sign Up failed. Please try again.');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      Alert.alert('Sign Up Error', 'An error occurred. Please try again.');
    } finally {
      // // Clear the input fields after sign-up attempt
      // setEmail('');
      // setPassword('');
    }
  };

  const handleVerify = async () => {
    try {
      const payload = { email: email_user, token: verificationCode, password: password_user};
      console.log(payload);
      const response = await axios.post(`${SERVER_URL}/verify_email`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data.success) {
        Alert.alert('Success', 'Email verified and account created successfully!');
        setIsVerifying(false); // Return to login
        setOtpInput(false);
        setShowSignup(false); // Hide Sign Up option after successful sign-up
        setShowLogin(true);
        setEmailInput(true);
        // Clear the input fields after sign-up attempt
        setEmail('');
        setPassword('');
      } else {
        Alert.alert('Error', response.data.message || 'Verification failed.');
        setIsVerifying(true); // Return to login
        setOtpInput(false);
        setShowSignup(true); // Hide Sign Up option after successful sign-up
        setShowLogin(false);
        setEmailInput(true);
        // Clear the input fields after sign-up attempt
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('Error during verification:', error);
      Alert.alert('Verification Error', 'An error occurred.');
      setIsVerifying(true); // Return to login
      setOtpInput(false);
      setShowSignup(true); // Hide Sign Up option after successful sign-up
      setShowLogin(false);
      setEmailInput(true);
      // Clear the input fields after sign-up attempt
      setEmail('');
      setPassword('');
    }

    // Reset the OTP state to empty
    setOtp(['', '', '', '', '', '']);

    // Reset focus to the first input
    if (inputs.current[0]) {
      (inputs.current[0] as TextInput).focus();
    }
  };


  return isLoggedIn ? (
    <AccountsScreen onLogout={handleLogout} />
  ) : (
    <View style={styles.container}>
      <Image
        // source={require('@/assets/images/google_icon_login.webp')} // Replace with your illustration
        source={require('@/assets/images/Moksh_Logo.png')} // Replace with your illustration
        style={styles.illustration}
      />
      <Text style={styles.title}>Jay Swaminarayan</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      {showOtpInput ? (
      <>
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.otpInput}
            value={digit}
            onChangeText={(text) => handleChangeText(text, index)}
            keyboardType="number-pad"
            maxLength={1} // Only one digit per input
            ref={(ref) => (inputs.current[index] = ref)} // Assign ref to the input
          />
        ))}
      </View>
      <TouchableOpacity style={styles.enterButton} onPress={handleVerify}>
      <Text style={styles.enterButtonText}>Submit</Text>
      </TouchableOpacity>
      </>
      ) : null}

      {/* Email and Password Login */}
      {showEmailInput ? (
      <>
        <TextInput
          style={styles.input}
          placeholder="Email Id"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email_user}
          onChangeText={(text) => setEmail(text)}
        />
      
        {/* <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          // secureTextEntry
          value={password_user}
          onChangeText={(text) => setPassword(text)}
        /> */}
        <View style={styles.passwordinputContainer}>
          <TextInput
            style={styles.passwordinput}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={!isPasswordVisible} // Toggle visibility
            value={password_user}
            onChangeText={(text) => setPassword(text)}
          />
          <TouchableOpacity
            style={styles.passwordeyeButton}
            onPress={() => setPasswordVisible(!isPasswordVisible)}
          >
            <MaterialIcons
              name={isPasswordVisible ? 'visibility' : 'visibility-off'}
              size={22}
              color="#999"
            />
          </TouchableOpacity>
        </View>
      </>
      ): null}

    {showLogin ? (
    <>
      <TouchableOpacity style={styles.emailButton} onPress={handleEmailLogin}>
        <Text style={styles.emailButtonText}>Login with Email</Text>
      </TouchableOpacity>
    </>
    ) : null}


      {/* Conditionally render Sign Up button */}
      {/* {showSignup && (
        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      )}     */}
      {showSignup && (
        <View style={styles.signupContainer}>
          {/* {isVerifying ? (
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
            >
              <Text style={styles.verifyButtonText}>Send Verification Code</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          )} */}
            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
        </View>
      )}

      {/* Google Login */}
      {showLogin ? (
      <>
      <TouchableOpacity
        style={styles.googleButton}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Text style={styles.googleButtonText}>Login with Google</Text>
      </TouchableOpacity>
      </>
      ): null}      
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
  // illustration: {
  //   width: 250,
  //   height: 250,
  //   marginBottom: 20,
  // },
  illustration: {
    width: 250,
    height: 75,
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
  passwordinputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  passwordinput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    color: '#333',
  },
  passwordeyeButton: {
    padding: 10,
  },
  emailButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  emailButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  signupContainer: {
    width: '100%',
    alignItems: 'center',
  },

  signupButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
    borderColor: 'black',
    borderWidth: 2
  },
  signupButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },

  verifyButton: { 
    backgroundColor: '#28A745', 
    padding: 10, 
    borderRadius: 5 },

  verifyButtonText: { 
    color: '#fff', 
    textAlign: 'center' },

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

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  otpInput: {
    width: 48,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    backgroundColor: '#fff',
    color: '#333',
  },
  enterButton: {
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
  },
  enterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
