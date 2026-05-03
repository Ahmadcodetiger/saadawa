import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../../components/atoms/Text';
import { Button } from '../../components/atoms/Button';
import { useAppTheme } from '../../theme/ThemeContext';
import { Info } from 'phosphor-react-native';

interface Props {
  visible: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
}

export const AdminInfoModal: React.FC<Props> = ({ visible, title, message, onClose }) => {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.iconRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}> 
              <Info size={20} color={colors.primary} weight="duotone" />
            </View>
            <Text variant="headingSmall" bold style={{ marginLeft: 12 }}>{title}</Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text variant="bodyMedium" color="textSecondary">{message}</Text>
          </View>

          <View style={styles.actions}>
            <Button label="Dismiss" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
});

export default AdminInfoModal;
