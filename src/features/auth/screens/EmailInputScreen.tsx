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
import { ArrowLeft, Mail } from 'lucide-react-native';
import { z } from 'zod';
import { Button, Input, IconButton } from '../../../shared/ui/components';
import { colors, typography, spacing, iconDefaults } from '../../../shared/ui/tokens';
import { sendEmailOtp } from '../api/auth';

const emailSchema = z.string().email('Please enter a valid email address');

export function EmailInputScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await sendEmailOtp(result.data);
      router.push({
        pathname: '/(auth)/otp',
        params: { method: 'email', identifier: result.data },
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
        <Text style={styles.title}>Enter your email</Text>
        <Text style={styles.subtitle}>
          We'll send you a 6-digit verification code
        </Text>

        <View style={styles.inputWrapper}>
          <Input
            testID="input-email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
            error={error ?? undefined}
            icon={
              <Mail
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
          disabled={!email.trim()}
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
