import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Phone, Chrome } from 'lucide-react-native';
import { Button } from '../../../shared/ui/components';
import { colors, typography, spacing, iconDefaults } from '../../../shared/ui/tokens';
import { signInWithGoogle } from '../api/auth';

export function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.logo}>FitHub</Text>
          <Text style={styles.tagline}>
            Track your lifts.{'\n'}See your progress.
          </Text>
        </View>

        {/* Auth Methods */}
        <View style={styles.actions}>
          <Button
            testID="btn-google"
            label="Sign in with Google"
            onPress={handleGoogleSignIn}
            variant="secondary"
            size="lg"
            fullWidth
            loading={loading}
            icon={
              <Chrome
                size={iconDefaults.size}
                strokeWidth={iconDefaults.strokeWidth}
                color={colors.textPrimary}
              />
            }
          />
          <Button
            testID="btn-email"
            label="Continue with Email"
            onPress={() => router.push('/(auth)/email')}
            variant="secondary"
            size="lg"
            fullWidth
            icon={
              <Mail
                size={iconDefaults.size}
                strokeWidth={iconDefaults.strokeWidth}
                color={colors.textPrimary}
              />
            }
          />
          <Button
            testID="btn-phone"
            label="Continue with Phone"
            onPress={() => router.push('/(auth)/phone')}
            variant="secondary"
            size="lg"
            fullWidth
            icon={
              <Phone
                size={iconDefaults.size}
                strokeWidth={iconDefaults.strokeWidth}
                color={colors.textPrimary}
              />
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } satisfies ViewStyle,
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  } satisfies ViewStyle,
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } satisfies ViewStyle,
  logo: {
    ...typography.display,
    fontSize: 48,
    lineHeight: 56,
    color: colors.accent,
    letterSpacing: -1,
  } satisfies TextStyle,
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  } satisfies TextStyle,
  actions: {
    gap: spacing.md,
  } satisfies ViewStyle,
});
