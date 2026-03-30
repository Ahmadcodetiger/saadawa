import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Receipt, Lightning, Lifebuoy, User, Wallet, PlusCircle } from 'phosphor-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';

const TAB_HEIGHT = 72;

const getIcon = (routeName: string, color: string, isFocused: boolean) => {
  const size = 24;
  const weight = isFocused ? 'fill' : 'regular';
  
  switch (routeName) {
    case 'index': return <House size={size} color={color} weight={weight} />;
    case 'transactions': return <Receipt size={size} color={color} weight={weight} />;
    case 'services': return <Lightning size={26} color="white" weight="bold" />;
    case 'support': return <Lifebuoy size={size} color={color} weight={weight} />;
    case 'profile': return <User size={size} color={color} weight={weight} />;
    case 'wallet': return <PlusCircle size={size} color={color} weight={weight} />;
    default: return <House size={size} color={color} weight={weight} />;
  }
};

const TabItem = ({ route, isFocused, onPress, colors, label }: any) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, {
      damping: 15,
      stiffness: 150,
    });
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1 : 0) }],
    opacity: withSpring(isFocused ? 1 : 0),
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tab}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        {getIcon(route.name, isFocused ? colors.primary : '#9CA3AF', isFocused)}
      </Animated.View>

      {/* Dot Indicator */}
      <Animated.View style={[styles.dotIndicator, { backgroundColor: colors.primary }, dotStyle]} />
      
      <Text 
        variant="overline" 
        color={isFocused ? 'primary' : 'textSecondary'} 
        bold={isFocused}
        style={{ 
            marginTop: 4, 
            fontSize: 10, 
            color: isFocused ? colors.primary : '#9CA3AF',
            fontWeight: isFocused ? '700' : '400' 
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const CustomBottomTabBar = ({ state, descriptors, navigation }: any) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: '#FFFFFF',
        paddingBottom: Math.max(insets.bottom, 16),
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
      }
    ]}>
      {state.routes.filter((route: any) => 
        descriptors[route.key].options.href !== null && route.name !== 'wallet'
      ).map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;
        const isCenter = route.name === 'services';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.centerTab}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#5B6AF0', '#7C3AED']}
                style={styles.centerButton}
              >
                {getIcon(route.name, 'white', true)}
              </LinearGradient>
              <Text 
                variant="overline" 
                color={isFocused ? 'primary' : 'textSecondary'} 
                bold={isFocused}
                style={{ 
                    marginTop: 4, 
                    fontSize: 10,
                    color: isFocused ? colors.primary : '#9CA3AF',
                    fontWeight: isFocused ? '700' : '400'
                }}
              >
                Quick Actions
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TabItem
            key={route.key}
            route={route}
            label={label}
            isFocused={isFocused}
            onPress={onPress}
            colors={colors}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: TAB_HEIGHT + 24,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    ...Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
        },
        android: {
            elevation: 8,
        }
    })
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_HEIGHT,
  },
  centerTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: TAB_HEIGHT + 12,
    paddingBottom: 4,
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#5B6AF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  iconContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
});
