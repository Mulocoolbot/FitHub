import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { User, LogOut } from 'lucide-react-native';
import { Button, Card } from '../../shared/ui/components';
import { colors, typography, spacing, radius, iconDefaults } from '../../shared/ui/tokens';
import { useAuth } from '../../features/auth/hooks/useAuth';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <Card>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <User size={28} color={colors.textSecondary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.user_metadata?.full_name ?? user?.email ?? 'User'}
              </Text>
              <Text style={styles.profileEmail}>
                {user?.email ?? user?.phone ?? ''}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            testID="btn-signout"
            label="Sign Out"
            onPress={signOut}
            variant="ghost"
            icon={<LogOut size={18} color={colors.error} strokeWidth={iconDefaults.strokeWidth} />}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
  } satisfies ViewStyle,
  title: {
    ...typography.title,
    color: colors.textPrimary,
  } satisfies TextStyle,
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  } satisfies ViewStyle,
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  } satisfies ViewStyle,
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
  profileInfo: {
    flex: 1,
  } satisfies ViewStyle,
  profileName: {
    ...typography.heading,
    color: colors.textPrimary,
  } satisfies TextStyle,
  profileEmail: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  } satisfies TextStyle,
  actions: {
    marginTop: spacing.xl,
  } satisfies ViewStyle,
});
