import React from 'react';
import { Tabs } from 'expo-router';
import { CustomBottomTabBar } from '../../src/components/organisms/CustomBottomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home' }}
      />
      
      <Tabs.Screen
        name="transactions"
        options={{ title: 'Activity' }}
      />

      <Tabs.Screen
        name="services"
        options={{ title: 'Quick Actions' }}
      />
 
      <Tabs.Screen
        name="support"
        options={{ title: 'Support' }}
      />
 
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
 
      <Tabs.Screen
        name="wallet"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="buy-airtime"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="buy-data"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="buy-cable"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="buy-electricity"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="buy-exampin"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="add-money"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="pay-bills"
        options={{ href: null }}
      />
    </Tabs>
  );
}

