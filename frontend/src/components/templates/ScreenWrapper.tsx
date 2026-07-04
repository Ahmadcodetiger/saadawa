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
  
  if (Platform.OS === 'web') {
    const outerBg = mode === 'dark' ? '#0B0F19' : '#F1F5F9';
    return (
      <View style={[
        styles.webOuterContainer,
        { backgroundColor: outerBg }
      ]}>
        <View style={[
          styles.container,
          styles.webInnerContainer as any,
          { 
            backgroundColor: backgroundColor || colors.background,
            borderColor: colors.border,
          }
        ]}>
          <StatusBar 
            barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent
          />
          {header}
          <KeyboardAvoidingView
            behavior="padding"
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
      </View>
    );
  }

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
  webOuterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  webInnerContainer: {
    width: '100%',
    maxWidth: 500,
    height: '100%',
    maxHeight: '100%',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
      }
    } as any)
  },
});
