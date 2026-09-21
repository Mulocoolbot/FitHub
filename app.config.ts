import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'FitHub',
  slug: 'FitHub',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: process.env.EXPO_PUBLIC_APP_SCHEME ?? 'fithub',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.mullo.fithub',
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#2F3337',
    },
    package: 'com.mullo.fithub',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#2F3337',
      },
    ],
    'expo-crypto',
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: `com.googleusercontent.apps.${(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? '').split('.')[0]}`,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
