import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button, Input } from '../../../shared/ui/components';
import { colors, typography, spacing, radius, touchTarget } from '../../../shared/ui/tokens';
import { updateProfile } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

type UnitOption = 'kg' | 'lb';

export function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<UnitOption>('kg');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await updateProfile(user.id, {
        display_name: name.trim() || null,
        unit_pref: unit,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.subtitle}>
          Just a few quick things to get started
        </Text>

        <View style={styles.form}>
          <Input
            testID="input-name"
            label="Display name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <View style={styles.unitSection}>
            <Text style={styles.unitLabel}>Weight unit</Text>
            <View style={styles.unitRow}>
              {(['kg', 'lb'] as UnitOption[]).map((opt) => (
                <Pressable
                  key={opt}
                  testID={`unit-${opt}`}
                  style={[
                    styles.unitButton,
                    unit === opt && styles.unitButtonActive,
                  ]}
                  onPress={() => {
                    setUnit(opt);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      unit === opt && styles.unitButtonTextActive,
                    ]}
                  >
                    {opt.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Button
          testID="btn-complete"
          label="Start Training"
          onPress={handleComplete}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    justifyContent: 'space-between',
    paddingBottom: spacing.xxl,
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
  form: {
    gap: spacing.xl,
    marginTop: spacing.xl,
  } satisfies ViewStyle,
  unitSection: {
    gap: spacing.sm,
  } satisfies ViewStyle,
  unitLabel: {
    ...typography.bodySm,
    color: colors.textSecondary,
  } satisfies TextStyle,
  unitRow: {
    flexDirection: 'row',
    gap: spacing.md,
  } satisfies ViewStyle,
  unitButton: {
    flex: 1,
    height: touchTarget.min,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
  unitButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  } satisfies ViewStyle,
  unitButtonText: {
    ...typography.subtitle,
    color: colors.textSecondary,
  } satisfies TextStyle,
  unitButtonTextActive: {
    color: colors.accent,
  } satisfies TextStyle,
});
