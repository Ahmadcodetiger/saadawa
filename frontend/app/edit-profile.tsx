import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ActionSheetIOS, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User, Envelope, Phone, MapPin, City, HouseLine } from 'phosphor-react-native';

import { useAppTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/components/atoms/Text';
import { Button } from '../src/components/atoms/Button';
import { Input } from '../src/components/atoms/Input';
import { ScreenWrapper } from '../src/components/templates/ScreenWrapper';
import { useAlert } from '@/components/AlertContext';
import { useProfile } from '@/components/ProfileContext';
import { userService } from '@/services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { showSuccess, showError } = useAlert();
  const { profileData, updateProfile } = useProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(profileData.profileImage);
  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsInitialLoading(true);
      const response = await userService.getProfile();
      if (response.success) {
        const user = response.data;
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setEmail(user.email || '');
        setPhoneNumber(user.phone_number || '');
        setAddress(user.address || '');
        setCity(user.city || '');
        setState(user.state || '');
        // Load profile image from server if available
        if (user.profile_image) {
          setProfileImage(user.profile_image);
        }
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleImagePick = async () => {
    const options = ['Cancel', 'Take Photo', 'Choose from Gallery'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) launchCamera();
          else if (idx === 2) launchLibrary();
        }
      );
    } else {
      Alert.alert('Change Picture', 'Select source', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: launchCamera },
        { text: 'Gallery', onPress: launchLibrary },
      ]);
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7 });
    if (!res.canceled) setProfileImage(res.assets[0].uri);
  };

  const launchLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1,1], quality: 0.7 });
    if (!res.canceled) setProfileImage(res.assets[0].uri);
  };

  const handleSave = async () => {
    if (!firstName || !lastName) {
      showError('Name fields are required'); return;
    }
    setIsLoading(true);
    try {
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        profile_image: profileImage, // send image URL to backend
      };
      
      const res = await userService.updateProfile(updateData);
      if (res.success) {
        updateProfile({ ...profileData, firstName, lastName, address, city, state, profileImage });
        // Update cached user data in AsyncStorage so dashboard avatar refreshes
        try {
          const cached = await AsyncStorage.getItem('userData');
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.profile_image = profileImage;
            parsed.first_name = firstName.trim();
            parsed.last_name = lastName.trim();
            await AsyncStorage.setItem('userData', JSON.stringify(parsed));
          }
        } catch (_) {}
        showSuccess('Profile updated!');
        setTimeout(() => router.back(), 1500);
      } else {
        showError(res.message || 'Update failed');
      }
    } catch (e: any) {
      showError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <View style={styles.header}>
        <Text variant="headingMedium" bold>Edit Profile</Text>
        <Text variant="bodySmall" color="textSecondary">Update your personal information</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
          <Image source={{ uri: profileImage }} style={styles.avatar} />
          <TouchableOpacity style={[styles.editIcon, { backgroundColor: colors.primary }]} onPress={handleImagePick}>
            <Camera size={18} color="white" weight="bold" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleImagePick}>
          <Text variant="bodyMedium" bold color="primary" style={{ marginTop: 12 }}>Change Picture</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text variant="labelMedium" color="textSecondary" medium style={styles.sectionTitle}>PERSONAL DETAILS</Text>
        <View style={styles.grid}>
          <View style={{ flex: 1 }}>
            <Input 
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                leftIcon={<User size={18} color={colors.textTertiary} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input 
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
            />
          </View>
        </View>

        <Input 
            label="Email Address"
            value={email}
            editable={false}
            leftIcon={<Envelope size={18} color={colors.textTertiary} />}
        />

        <Input 
            label="Phone Number"
            value={phoneNumber}
            editable={false}
            leftIcon={<Phone size={18} color={colors.textTertiary} />}
        />

        <Text variant="labelMedium" color="textSecondary" medium style={[styles.sectionTitle, { marginTop: 16 }]}>ADDRESS</Text>
        <Input 
            label="Street Address"
            value={address}
            onChangeText={setAddress}
            leftIcon={<HouseLine size={18} color={colors.textTertiary} />}
        />

        <View style={styles.grid}>
          <View style={{ flex: 1 }}>
            <Input 
                label="City"
                value={city}
                onChangeText={setCity}
                leftIcon={<City size={18} color={colors.textTertiary} />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input 
                label="State"
                value={state}
                onChangeText={setState}
                leftIcon={<MapPin size={18} color={colors.textTertiary} />}
            />
          </View>
        </View>
      </View>

      <Button 
        label="Save Changes"
        onPress={handleSave}
        loading={isLoading}
        style={styles.saveBtn}
      />

      <View style={{ height: 100 }} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    padding: 3,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  form: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  saveBtn: {
    marginTop: 12,
  },
});