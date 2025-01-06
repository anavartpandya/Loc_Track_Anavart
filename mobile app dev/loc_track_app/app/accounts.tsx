import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';

export default function AccountsScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/Moksh_Logo.png')} // Replace with your logo path
        style={styles.logo}
      />
      <Text style={styles.title}>Jay Swaminarayan</Text>
      <Text style={styles.subtitle}>Welcome to your Account</Text>

      {/* Placeholder for Account Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Details</Text>
        <Text style={styles.cardText}>Email: user@example.com</Text>
        <Text style={styles.cardText}>Membership: Premium</Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: onLogout },
          ]);
        }}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7eada',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
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
  card: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  logoutButton: {
    backgroundColor: '#cf6113',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
