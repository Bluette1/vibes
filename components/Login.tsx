import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const backgroundImage = require('../assets/screenshot-vibes-home-page.png'); // Adjust the path as necessary

const { width } = Dimensions.get('window');

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { login, continueAsGuest } = useAuth();

  const handleLogin = async () => {
    try {
      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL || 'https://vibes-api-space-f970ef69ea72.herokuapp.com';
      const response = await axios.post(`${apiUrl}/users/tokens/sign_in`, {
        email,
        password,
      });

      if (response.data.token) {
        await login(response.data.token);
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    }
  };

  const handleSignUp = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await axios.post(`${apiUrl}/users/tokens/sign_up`, {
        email,
        password,
      });

      if (response.data.token) {
        await login(response.data.token);
      } else {
        Alert.alert('Error', 'Sign up failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Sign up failed');
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.container} resizeMode="cover">
      <View style={styles.innerContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.loginButton}
          onPress={isSignUp ? handleSignUp : handleLogin}>
          <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Login'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.guestButton} onPress={continueAsGuest}>
          <Text style={styles.guestButtonText}>Continue to Vibes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account? Login' : 'Don’t have an account? Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    padding: width > 900 ? 10 : 0,
    width: '100%',
    borderRadius: 10,
    margin: width > 900 ? 10 : 0,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: width > 900 ? 20 : 10,
    width: width > 900 ? 700 : '100%',
    alignSelf: 'center',
    borderRadius: width > 900 ? 10 : 0,
    margin: width > 900 ? 10 : 5,
  },
  welcomeText: {
    color: 'white',
    fontSize: width > 400 ? 24 : 20,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  signUpButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  guestButton: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666666',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: width > 400 ? 16 : 14,
  },
  guestButtonText: {
    color: '#666666',
    fontSize: width > 400 ? 16 : 14,
  },
  toggleText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 15,
  },
});

export default Login;
