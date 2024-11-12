// app/components/Login.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { width } = Dimensions.get('window');

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, continueAsGuest } = useAuth();

  const handleLogin = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
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

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to Vibes</Text>
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
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.guestButton} onPress={continueAsGuest}>
        <Text style={styles.guestButtonText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1E1E1E',
    width: width > 900 ? 700 : '100%',
    alignSelf: 'center',
    borderRadius: width > 900 ? 10 : 0,
    margin: width > 900 ? 10 : 0,
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
});

export default Login;
