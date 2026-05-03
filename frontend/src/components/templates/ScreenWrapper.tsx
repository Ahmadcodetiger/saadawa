import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  padding?: boolean;
  backgroundColor?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  refreshControl?: any;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scroll = false,
  padding = true,
  backgroundColor,
  header,
  footer,
  refreshControl,
}) => {
  const { colors, mode } = useAppTheme();
  const insets = useSafeAreaInsets();

  const Container = scroll ? ScrollView : View;
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: backgroundColor || colors.background,
        paddingTop: insets.top
      }
    ]}>
      <StatusBar 
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent
      />
      
      {header}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <Container
          style={styles.flex}
          contentContainerStyle={scroll ? [styles.scrollContent, padding && styles.padding] : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={scroll ? refreshControl : undefined}
        >
          <View style={[styles.flex, !scroll && padding && styles.padding]}>
            {children}
          </View>
        </Container>
      </KeyboardAvoidingView>
      
      {footer}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});
