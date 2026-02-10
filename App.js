// Quotiva App - Entry Point
// Quote Cinematics app with warm stitched theme
import 'react-native-gesture-handler'; // Must be at the top
import React, { useEffect, useCallback, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import { HomeScreen, DiscoverScreen, CreateScreen, ProfileScreen, SavedScreen } from './src/screens';
import SplashScreenComponent from './src/screens/SplashScreen';
import { colors } from './src/theme';
import { Home, Search, Bookmark, User, Plus } from 'lucide-react-native';


// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

// Floating Create Button
const CreateTabIcon = ({ focused }) => (
  <View style={styles.createButtonContainer}>
    <View style={[styles.createButton, focused && styles.createButtonFocused]}>
      <Plus name="add" size={30} color={colors.text.light} />
    </View>
  </View>
);

// Tab Navigator
const TabNavigator = () => (
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
      name="Create"
      component={CreateScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <CreateTabIcon focused={focused} />
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
  const [showSplash, setShowSplash] = useState(true);

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

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!isReady) {
    return null;
  }

  // Show custom splash screen
  if (showSplash) {
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
  createButtonContainer: {
    position: 'relative',
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonFocused: {
    transform: [{ scale: 1.05 }],
  },

});
