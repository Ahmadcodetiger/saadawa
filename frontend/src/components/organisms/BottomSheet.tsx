/**
 * src/components/organisms/BottomSheet.tsx
 */

import React, { forwardRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomSheetRoot, { 
  BottomSheetBackdrop, 
  BottomSheetView,
  BottomSheetBackdropProps
} from '@gorhom/bottom-sheet';
import { useAppTheme } from '../../theme/ThemeContext';
import { Text } from '../atoms/Text';

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[];
  title?: string;
  onClose?: () => void;
}

export const BottomSheet = forwardRef<BottomSheetRoot, BottomSheetProps>(
  ({ children, snapPoints = ['50%'], title, onClose }, ref) => {
    const { colors } = useAppTheme();
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    const renderBackdrop = (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        opacity={0.5}
      />
    );

    return (
      <BottomSheetRoot
        ref={ref}
        index={-1}
        snapPoints={memoizedSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        backgroundStyle={{ backgroundColor: colors.background }}
        onClose={onClose}
      >
        <BottomSheetView style={styles.content}>
          {title && (
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text variant="headingSmall" bold>{title}</Text>
            </View>
          )}
          <View style={styles.body}>
            {children}
          </View>
        </BottomSheetView>
      </BottomSheetRoot>
    );
  }
);

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  body: {
    flex: 1,
    padding: 20,
  },
});
