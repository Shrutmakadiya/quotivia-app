// QuotesHub App - Entry Point
// Quote Cinematics app with warm stitched theme
import 'react-native-gesture-handler'; // Must be at the top
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { StatusBar, View, Text, StyleSheet, Platform, Pressable, Linking, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HomeScreen, DiscoverScreen, ProfileScreen, SavedScreen } from './src/screens';
import SplashScreenComponent from './src/screens/SplashScreen';
import { colors } from './src/theme';
import { Home, Search, Bookmark, User } from 'lucide-react-native';
import api from './src/services/api';
import { initializeAdManager, showManagedAppOpen } from './src/services/adManager';
import { fetchMonetizationConfig } from './src/services/monetization';
import { orderQuotesForSessionNoImmediateRepeat } from './src/utils/quoteOrder';


// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const PRELOAD_TIMEOUT_MS = 8000;
const DEFAULT_ANDROID_PACKAGE = 'com.QuotesHub.app';
const DEFAULT_ANDROID_STORE_URL = `https://play.google.com/store/apps/details?id=${DEFAULT_ANDROID_PACKAGE}`;
const FALLBACK_APP_VERSION = '0.0.0';
const DEVICE_ID_KEY = 'QuotesHub_device_id';

const withTimeout = (promise, timeoutMs) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

const getAppVersion = () => (
  Constants.expoConfig?.version
  || Constants.manifest2?.extra?.expoClient?.version
  || FALLBACK_APP_VERSION
);

const getAndroidPackageName = () => (
  Constants.expoConfig?.android?.package || DEFAULT_ANDROID_PACKAGE
);

const parseVersionSegments = (version) => (
  String(version || '')
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((segment) => (Number.isFinite(segment) && segment >= 0 ? segment : 0))
);

const isVersionLower = (currentVersion, minimumVersion) => {
  const currentSegments = parseVersionSegments(currentVersion);
  const minimumSegments = parseVersionSegments(minimumVersion);
  const maxLength = Math.max(currentSegments.length, minimumSegments.length);

  for (let index = 0; index < maxLength; index += 1) {
    const current = currentSegments[index] || 0;
    const minimum = minimumSegments[index] || 0;

    if (current < minimum) return true;
    if (current > minimum) return false;
  }

  return false;
};

const ForceUpdateScreen = ({ currentVersion, minimumVersion, storeUrl }) => {
  const onUpdatePress = useCallback(async () => {
    try {
      const canOpen = await Linking.canOpenURL(storeUrl);
      if (!canOpen) {
        return;
      }
      await Linking.openURL(storeUrl);
    } catch (error) {
      console.log('Unable to open store URL:', error?.message || error);
    }
  }, [storeUrl]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <View style={styles.forceUpdateContainer}>
          <Text style={styles.forceUpdateTitle}>Update Required</Text>
          <Text style={styles.forceUpdateText}>
            This app version is no longer supported. Update from Play Store to continue.
          </Text>
          <Text style={styles.forceUpdateMeta}>
            Current: {currentVersion} | Required: {minimumVersion}
          </Text>
          <Pressable style={styles.forceUpdateButton} onPress={onUpdatePress}>
            <Text style={styles.forceUpdateButtonText}>Update App</Text>
          </Pressable>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

// Custom Tab Bar Icon
const TabIcon = ({ name, label, focused }) => {
  const IconComponent = {
    home: Home,
    search: Search,
    bookmark: Bookmark,
    person: User,
  }[name] || Home;

  return (
    <View style={styles.tabItem}>
      <IconComponent
        size={24}
        color={focused ? colors.accent.gold : colors.text.tertiary}
        strokeWidth={focused ? 2.5 : 2}
        style={{ marginBottom: 4 }}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
};

// Tab Navigator
const TabNavigator = ({ route }) => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.ui.tabBar,
        borderTopColor: colors.ui.border,
        borderTopWidth: 1,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        height: Platform.OS === 'ios' ? 85 : 70,
        elevation: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon name="home" label="Home" focused={focused} />
        ),
      }}
      initialParams={{ initialQuotes: route?.params?.initialQuotes }}
    />
    <Tab.Screen
      name="Discover"
      component={DiscoverScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon name="search" label="Search" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Saved"
      component={SavedScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon name="bookmark" label="Saved" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon name="person" label="Profile" focused={focused} />
        ),
      }}
    />
  </Tab.Navigator>
);

// Main App Component
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);
  const [initialQuotes, setInitialQuotes] = useState([]);
  const [quotesPreloadDone, setQuotesPreloadDone] = useState(false);
  const [versionCheckDone, setVersionCheckDone] = useState(false);
  const [requiredUpdate, setRequiredUpdate] = useState(null);
  const appStateRef = useRef(AppState.currentState);
  const hasMainUiRenderedRef = useRef(false);
  const appOpenConfigRef = useRef(null);
  const appOpenDeviceIdRef = useRef('');
  const appOpenTriggerBusyRef = useRef(false);
  const shouldShowCustomSplash = !versionCheckDone || !splashAnimationDone || !quotesPreloadDone;

  const refreshAppOpenContext = useCallback(async (force = false) => {
    try {
      const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      appOpenDeviceIdRef.current = storedDeviceId || '';
      const config = await fetchMonetizationConfig({
        deviceId: storedDeviceId || '',
        force,
      });
      appOpenConfigRef.current = config;
    } catch (error) {
      appOpenConfigRef.current = null;
    }
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Hide the native splash screen immediately
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkVersionPolicy = async () => {
      try {
        const policy = await withTimeout(api.getVersionPolicy(Platform.OS), PRELOAD_TIMEOUT_MS);
        const forceUpdateEnabled = policy?.forceUpdateEnabled !== false;
        const minimumVersion = String(policy?.minSupportedVersion || '').trim();

        if (forceUpdateEnabled && minimumVersion) {
          const currentVersion = getAppVersion();
          const isBlockedVersion = isVersionLower(currentVersion, minimumVersion);

          if (isBlockedVersion && isMounted) {
            const fallbackStoreUrl = `https://play.google.com/store/apps/details?id=${getAndroidPackageName()}`;
            setRequiredUpdate({
              currentVersion,
              minimumVersion,
              storeUrl: policy?.storeUrl || fallbackStoreUrl,
            });
          }
        }
      } catch (error) {
        console.log('Version policy check skipped:', error?.message || error);
      } finally {
        if (isMounted) {
          setVersionCheckDone(true);
        }
      }
    };

    if (isReady) {
      checkVersionPolicy();
    }

    return () => {
      isMounted = false;
    };
  }, [isReady]);

  // Preload quotes during splash screen
  useEffect(() => {
    let isMounted = true;

    async function preloadData() {
      try {
        const data = await withTimeout(api.getQuotes(1, 50), PRELOAD_TIMEOUT_MS);
        const quotesList = Array.isArray(data) ? data : (data?.quotes || []);
        const orderedQuotes = await orderQuotesForSessionNoImmediateRepeat(quotesList);
        if (isMounted) {
          setInitialQuotes(orderedQuotes);
        }
      } catch (error) {
        console.log('Preload failed, HomeScreen will fetch on mount:', error?.message || error);
        if (isMounted) {
          setInitialQuotes([]);
        }
      } finally {
        if (isMounted) {
          setQuotesPreloadDone(true);
        }
      }
    }
    
    if (isReady && versionCheckDone && !requiredUpdate) {
      preloadData();
    } else if (isReady && versionCheckDone && requiredUpdate && isMounted) {
      setQuotesPreloadDone(true);
    }
    
    return () => {
      isMounted = false;
    };
  }, [isReady, versionCheckDone, requiredUpdate]);

  useEffect(() => {
    initializeAdManager().catch((error) => {
      console.log('Ad SDK initialization skipped:', error?.message || error);
    });
  }, []);

  useEffect(() => {
    if (!isReady) return;
    refreshAppOpenContext(false);
  }, [isReady, refreshAppOpenContext]);

  useEffect(() => {
    if (!shouldShowCustomSplash && !requiredUpdate) {
      hasMainUiRenderedRef.current = true;
    }
  }, [requiredUpdate, shouldShowCustomSplash]);

  useEffect(() => {
    if (!isReady || !versionCheckDone || requiredUpdate) return undefined;

    const subscription = AppState.addEventListener('change', async (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      const resumedFromBackground = (
        (previousState === 'background' || previousState === 'inactive')
        && nextState === 'active'
      );

      if (!resumedFromBackground) return;
      if (!hasMainUiRenderedRef.current) return;
      if (appOpenTriggerBusyRef.current) return;

      appOpenTriggerBusyRef.current = true;
      try {
        await refreshAppOpenContext(true);
        if (!appOpenConfigRef.current) return;

        await showManagedAppOpen({
          config: appOpenConfigRef.current,
          deviceId: appOpenDeviceIdRef.current,
          placement: 'appOpen',
        });
      } finally {
        appOpenTriggerBusyRef.current = false;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isReady, refreshAppOpenContext, requiredUpdate, versionCheckDone]);

  const handleSplashFinish = useCallback(() => {
    setSplashAnimationDone(true);
  }, []);

  if (!isReady) {
    return null;
  }

  if (versionCheckDone && requiredUpdate) {
    return (
      <ForceUpdateScreen
        currentVersion={requiredUpdate.currentVersion}
        minimumVersion={requiredUpdate.minimumVersion}
        storeUrl={requiredUpdate.storeUrl || DEFAULT_ANDROID_STORE_URL}
      />
    );
  }

  // Keep custom splash visible until animation + preload both complete
  if (shouldShowCustomSplash) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" />
          <SplashScreenComponent onFinish={handleSplashFinish} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer
          theme={{
            dark: false,
            colors: {
              primary: colors.accent.gold,
              background: colors.background.primary,
              card: colors.background.secondary,
              text: colors.text.primary,
              border: colors.ui.border,
              notification: colors.accent.gold,
            },
          }}
        >
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background.primary },
            }}
          >
            <Stack.Screen 
              name="Main" 
              component={TabNavigator}
              initialParams={{ initialQuotes }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabLabelFocused: {
    color: colors.accent.gold,
    fontWeight: '700',
  },
  forceUpdateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background.primary,
  },
  forceUpdateTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  forceUpdateText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.text.secondary,
    marginBottom: 12,
  },
  forceUpdateMeta: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: 28,
  },
  forceUpdateButton: {
    backgroundColor: colors.accent.gold,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  forceUpdateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background.primary,
  },
});
