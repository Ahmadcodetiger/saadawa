import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { CaretDown, Check } from 'phosphor-react-native';
import { Input } from '../atoms/Input';
import { Text } from '../atoms/Text';
import { useAppTheme } from '../../theme/ThemeContext';

interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

interface SelectInputProps {
  label: string;
  value: string | null;
  options: SelectOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder,
  error,
  leftIcon,
}) => {
  const { colors } = useAppTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setModalVisible(true)}>
        <View pointerEvents="none">
          <Input
            label={label}
            value={selectedOption ? selectedOption.label : ''}
            placeholder={placeholder}
            error={error}
            editable={false}
            leftIcon={leftIcon}
            rightIcon={<CaretDown size={20} color={colors.textTertiary} />}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text variant="headingSmall" bold>Select {label}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text variant="bodyMedium" color="primary">Close</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => {
                    const isSelected = item.value === value;
                    return (
                      <TouchableOpacity
                        style={[styles.optionItem, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          onSelect(item.value);
                          setModalVisible(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text variant="bodyMedium" color={isSelected ? 'primary' : 'textPrimary'} bold={isSelected}>
                            {item.label}
                          </Text>
                          {item.description ? (
                            <Text variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                              {item.description}
                            </Text>
                          ) : null}
                        </View>
                        {isSelected && <Check size={20} color={colors.primary} weight="bold" />}
                      </TouchableOpacity>
                    );
                  }}
                  contentContainerStyle={{ paddingVertical: 8 }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 32, // Extra padding for safe area
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1, // Subtle separator
  },
});
