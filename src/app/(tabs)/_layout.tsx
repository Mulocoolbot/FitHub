import { Tabs } from 'expo-router';
import { Dumbbell, ListFilter, BarChart3, User } from 'lucide-react-native';
import { colors, typography, iconDefaults } from '../../shared/ui/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.surfaceMuted,
          borderTopWidth: 0.5,
          height: 84,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.surfaceMuted,
        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color }) => (
            <Dumbbell size={iconDefaults.size} color={color} strokeWidth={iconDefaults.strokeWidth} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => (
            <ListFilter size={iconDefaults.size} color={color} strokeWidth={iconDefaults.strokeWidth} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <BarChart3 size={iconDefaults.size} color={color} strokeWidth={iconDefaults.strokeWidth} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <User size={iconDefaults.size} color={color} strokeWidth={iconDefaults.strokeWidth} />
          ),
        }}
      />
    </Tabs>
  );
}
