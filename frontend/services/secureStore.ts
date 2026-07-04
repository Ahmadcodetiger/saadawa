import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getItemAsync = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error in SecureStore.getItemAsync:', error);
    if (Platform.OS === 'web') return null;
    // Fallback to AsyncStorage on native if SecureStore fails
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error in SecureStore.setItemAsync:', error);
    // Fallback
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('Fallback setItem failed:', e);
    }
  }
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error in SecureStore.deleteItemAsync:', error);
    // Fallback
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Fallback removeItem failed:', e);
    }
  }
};
