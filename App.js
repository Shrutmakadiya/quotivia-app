// Quotiva App - Entry Point
// Quote Cinematics app with daily streaks and gamification
import 'react-native-gesture-handler'; // Must be at the top
import React, { useEffect, useCallback, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';

import { HomeScreen, DiscoverScreen, CreateScreen, ProfileScreen } from './src/screens';
import { colors } from './src/theme';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon
const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabItem}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

// Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.background.secondary,
        borderTopColor: colors.ui.border,
        borderTopWidth: 1,
        paddingTop: 8,
        paddingBottom: 8,
        height: 70,
      },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon icon="✨" label="Home" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Discover"
      component={DiscoverScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon icon="🔍" label="Discover" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Create"
      component={CreateScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon icon="➕" label="Create" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon icon="👤" label="Profile" focused={focused} />
        ),
      }}
    />
  </Tab.Navigator>
);



// Main App Component
export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Mock loading time
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer
          theme={{
            dark: true,
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
            <Stack.Screen name="Main" component={TabNavigator} />
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
  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  tabIconFocused: {
    fontSize: 24,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: colors.accent.gold,
    fontWeight: '600',
  },
});
