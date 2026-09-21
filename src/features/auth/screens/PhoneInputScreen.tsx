import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Phone } from 'lucide-react-native';
import { z } from 'zod';
import { Button, Input, IconButton } from '../../../shared/ui/components';
import { colors, typography, spacing, iconDefaults } from '../../../shared/ui/tokens';
import { sendPhoneOtp } from '../api/auth';

const phoneSchema = z
  .string()
  .min(10, 'Phone number is too short')
  .regex(/^\+?[\d\s-]+$/, 'Please enter a valid phone number');

export function PhoneInputScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('+62');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/[\s-]/g, '');
    const result = phoneSchema.safeParse(cleaned);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await sendPhoneOtp(result.data);
      router.push({
        pathname: '/(auth)/otp',
        params: { method: 'phone', identifier: result.data },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
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
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Enter your phone</Text>
        <Text style={styles.subtitle}>
          We'll send you a 6-digit verification code via SMS
        </Text>

        <View style={styles.inputWrapper}>
          <Input
            testID="input-phone"
            placeholder="+62 812 345 6789"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setError(null);
            }}
            keyboardType="phone-pad"
            autoFocus
            error={error ?? undefined}
            icon={
              <Phone
                size={18}
                strokeWidth={iconDefaults.strokeWidth}
                color={colors.textSecondary}
              />
            }
          />
        </View>

        <Button
          testID="btn-send-otp"
          label="Send Code"
          onPress={handleSendOtp}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={phone.length < 10}
        />
      </KeyboardAvoidingView>
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
  inputWrapper: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  } satisfies ViewStyle,
});
