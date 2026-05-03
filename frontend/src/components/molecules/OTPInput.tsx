/**
 * src/components/molecules/OTPInput.tsx
 * 
 * Multi-box OTP input with auto-advance.
 */

import React, { useRef, useState } from 'react';
import { View, StyleSheet, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';

interface OTPInputProps {
  codeLength?: number;
  onCodeFilled: (code: string) => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({ codeLength = 6, onCodeFilled }) => {
  const { colors, theme } = useAppTheme();
  const [code, setCode] = useState<string[]>(new Array(codeLength).fill(''));
  const inputs = useRef<TextInput[]>([]);

  const handleChangeText = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text.length > 0 && index < codeLength - 1) {
      inputs.current[index + 1].focus();
    }

    if (newCode.every(digit => digit !== '') && newCode.join('').length === codeLength) {
      onCodeFilled(newCode.join(''));
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && code[index] === '') {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.container}>
      {new Array(codeLength).fill(0).map((_, index) => (
        <TextInput
          key={index}
          ref={ref => { inputs.current[index] = ref as TextInput; }}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: code[index] ? colors.primary : colors.border,
              color: colors.textPrimary,
              fontFamily: theme.fonts.medium,
            },
          ]}
          maxLength={1}
          keyboardType="number-pad"
          onChangeText={text => handleChangeText(text, index)}
          onKeyPress={e => handleKeyPress(e, index)}
          value={code[index]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 24,
  },
  input: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 20,
  },
});
