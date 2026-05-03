import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';

export interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  profileImage: string;
}

interface ProfileContextType {
  profileData: ProfileData;
  updateProfile: (data: ProfileData) => void;
  getFullName: () => string;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    profileImage: 'https://i.pravatar.cc/150?img=12',
  });

  const mapUserDataToProfile = (user: any): ProfileData => ({
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email || '',
    phoneNumber: user.phone_number || '',
    address: user.address || '',
    city: user.city || '',
    state: user.state || '',
    profileImage: user.avatar || 'https://i.pravatar.cc/150?img=12',
  });

  const loadUserProfile = async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        // Try to get from local storage first
        const cachedUser = await authService.getCurrentUser();
        if (cachedUser) {
          setProfileData(mapUserDataToProfile(cachedUser));
          return;
        }
      }

      // Fetch from server
      const response = await userService.getProfile();
      if (response.data?.success && response.data?.data?.user) {
        setProfileData(mapUserDataToProfile(response.data.data.user));
        // Update local cache
        const currentUser = await authService.getCurrentUser() || {};
        await authService.updateCurrentUser({ ...currentUser, ...response.data.data.user });
      }
    } catch (error) {
      console.log('Failed to load profile from server, using cached data', error);
      if (forceRefresh) {
        // If force refresh failed, try to fallback to cached user data just in case
        const cachedUser = await authService.getCurrentUser();
        if (cachedUser) {
          setProfileData(mapUserDataToProfile(cachedUser));
        }
      }
    }
  };

  // Load user data on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const refreshProfile = async () => {
    await loadUserProfile(true);
  };

  const updateProfile = (data: ProfileData) => {
    setProfileData(data);
  };

  const getFullName = () => {
    return `${profileData.firstName} ${profileData.lastName}`;
  };

  return (
    <ProfileContext.Provider value={{ profileData, updateProfile, getFullName, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};