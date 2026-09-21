import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  SafeAreaView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, typography, spacing, radius, motion, iconDefaults } from '../../../shared/ui/tokens';
import { Button, IconButton } from '../../../shared/ui/components';
import { verifyEmailOtp, verifyPhoneOtp, sendEmailOtp, sendPhoneOtp } from '../api/auth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ method: string; identifier: string }>();
  const method = params.method as 'email' | 'phone';
  const identifier = params.identifier ?? '';

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const shakeX = useSharedValue(0);
  const animatedShake = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = useCallback(
    (text: string, index: number) => {
      setError(null);
      const newCode = [...code];

      // Handle paste
      if (text.length > 1) {
        const pasted = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
        for (let i = 0; i < OTP_LENGTH; i++) {
          newCode[i] = pasted[i] ?? '';
        }
        setCode(newCode);
        const lastFilledIndex = Math.min(pasted.length - 1, OTP_LENGTH - 1);
        inputRefs.current[lastFilledIndex]?.focus();

        if (pasted.length === OTP_LENGTH) {
          handleVerify(newCode.join(''));
        }
        return;
      }

      // Single character
      newCode[index] = text.replace(/\D/g, '');
      setCode(newCode);

      if (text && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      const fullCode = newCode.join('');
      if (fullCode.length === OTP_LENGTH && !newCode.includes('')) {
        handleVerify(fullCode);
      }
    },
    [code],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !code[index] && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code],
  );

  const handleVerify = async (otp: string) => {
    try {
      setLoading(true);
      setError(null);

      if (method === 'email') {
        await verifyEmailOtp(identifier, otp);
      } else {
        await verifyPhoneOtp(identifier, otp);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Verification failed';
      const isExpired = message.toLowerCase().includes('expired');
      setError(isExpired ? 'Code expired. Please request a new one.' : 'Invalid code. Please try again.');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (method === 'email') {
        await sendEmailOtp(identifier);
      } else {
        await sendPhoneOtp(identifier);
      }
      setResendTimer(RESEND_COOLDOWN);
      setCode(Array(OTP_LENGTH).fill(''));
      setError(null);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon={<ArrowLeft size={iconDefaults.size} color={colors.textPrimary} />}
          onPress={() => router.back()}
          testID="btn-back"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Enter verification code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.identifier}>{identifier}</Text>
        </Text>

        <Animated.View style={[styles.codeRow, animatedShake]}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
                error != null ? styles.codeInputError : null,
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              selectTextOnFocus
              selectionColor={colors.textPrimary}
              testID={`otp-input-${index}`}
            />
          ))}
        </Animated.View>

        {error != null && <Text style={styles.error}>{error}</Text>}

        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>
              Resend in {resendTimer}s
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text style={styles.resendLink}>Resend code</Text>
            </Pressable>
          )}
        </View>

        <Button
          testID="btn-verify"
          label="Verify"
          onPress={() => handleVerify(code.join(''))}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={code.includes('')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } satisfies ViewStyle,
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  } satisfies ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  } satisfies ViewStyle,
  title: {
    ...typography.title,
    color: colors.textPrimary,
  } satisfies TextStyle,
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  } satisfies TextStyle,
  identifier: {
    color: colors.textPrimary,
    fontWeight: '600',
  } satisfies TextStyle,
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  } satisfies ViewStyle,
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.surfaceMuted,
    backgroundColor: colors.surfaceElevated,
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
  } satisfies TextStyle,
  codeInputFilled: {
    borderColor: colors.textPrimary,
  } satisfies ViewStyle,
  codeInputError: {
    borderColor: colors.error,
  } satisfies ViewStyle,
  error: {
    ...typography.label,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.base,
  } satisfies TextStyle,
  resendRow: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  } satisfies ViewStyle,
  resendTimer: {
    ...typography.label,
    color: colors.surfaceMuted,
  } satisfies TextStyle,
  resendLink: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  } satisfies TextStyle,
});
