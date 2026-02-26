// Streak Management Hook
// Handles daily quote tracking, streak calculation, and badge unlocking
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import api from '../services/api';

const DAILY_QUOTA = 4;
const STORAGE_KEY = 'QuotesHub_streak';
const DEVICE_ID_KEY = 'QuotesHub_device_id';

const BADGES = {
    20: { id: 'shayar', title: 'Rising Shayar', icon: '✍️' },
    50: { id: 'speaker', title: 'Motivational Speaker', icon: '🎤' },
    100: { id: 'master', title: 'Wisdom Master', icon: '👑' },
};

// Generate a random device ID for anonymous tracking
const generateDeviceId = () => {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () =>
        Math.floor(Math.random() * 16).toString(16)
    );
};

export const useStreak = () => {
    const [streak, setStreak] = useState({
        count: 0,      // Today's quote count
        total: 0,      // Total streak days
        date: null,    // Last activity date
        max: 0,        // Max streak ever
    });
    const [badges, setBadges] = useState([]);
    const [newBadge, setNewBadge] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [deviceId, setDeviceId] = useState(null);

    // Initialize streak data on mount
    useEffect(() => {
        loadStreakData();
    }, []);

    const loadStreakData = async () => {
        try {
            setIsLoading(true);

            // Get or create device ID
            let storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
            if (!storedDeviceId) {
                storedDeviceId = generateDeviceId();
                await AsyncStorage.setItem(DEVICE_ID_KEY, storedDeviceId);
            }
            setDeviceId(storedDeviceId);

            // Load local streak data
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                setStreak(parsed.streak || streak);
                setBadges(parsed.badges || []);
            }

            // Try to sync with server
            try {
                const userData = await api.getUser(storedDeviceId);
                if (userData) {
                    setBadges(userData.badges || []);
                    // Merge server streak if more recent
                    if (userData.streak) {
                        setStreak(prev => ({
                            ...prev,
                            total: Math.max(prev.total, userData.streak.current),
                            max: Math.max(prev.max, userData.streak.max),
                        }));
                    }
                }
            } catch (e) {
                // Server offline, continue with local data
                console.log('Server sync failed, using local data');
            }
        } catch (error) {
            console.error('Failed to load streak data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Save streak data locally
    const saveStreakData = async (newStreak, newBadges = badges) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                streak: newStreak,
                badges: newBadges,
            }));
        } catch (error) {
            console.error('Failed to save streak data:', error);
        }
    };

    // Record a quote view (called when user reads a quote)
    const recordQuoteView = useCallback(async (quoteId) => {
        const today = new Date().toDateString();

        setStreak(prevStreak => {
            let newStreak = { ...prevStreak };

            // Check if it's a new day
            if (newStreak.date !== today) {
                // Was previous day's quota met?
                if (newStreak.count >= DAILY_QUOTA) {
                    // Streak continues
                    newStreak.total += 1;
                } else if (newStreak.date) {
                    // Check if it was yesterday
                    const lastDate = new Date(newStreak.date);
                    const todayDate = new Date(today);
                    const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

                    if (diffDays > 1) {
                        // Streak broken - missed a day
                        newStreak.total = 0;
                    }
                }

                // Reset for new day
                newStreak.count = 0;
                newStreak.date = today;
            }

            // Increment today's count
            newStreak.count += 1;

            // Update max streak
            if (newStreak.total > newStreak.max) {
                newStreak.max = newStreak.total;
            }

            // Check for daily completion
            if (newStreak.count === DAILY_QUOTA) {
                newStreak.total += 1;
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Check for badge unlock
                const badge = BADGES[newStreak.total];
                if (badge && !badges.find(b => b.id === badge.id)) {
                    const newBadgeData = { ...badge, earnedAt: new Date().toISOString() };
                    setBadges(prev => [...prev, newBadgeData]);
                    setNewBadge(newBadgeData);
                    saveStreakData(newStreak, [...badges, newBadgeData]);

                    // Sync badge to server
                    if (deviceId) {
                        api.syncStreak(deviceId, newStreak).catch(console.error);
                    }
                }
            }

            // Save to storage
            saveStreakData(newStreak);

            // Sync to server (non-blocking)
            if (deviceId && quoteId) {
                api.recordQuoteView(deviceId, quoteId).catch(console.error);
            }

            return newStreak;
        });

        // Light haptic for each quote
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [badges, deviceId]);

    // Clear the new badge notification
    const clearNewBadge = useCallback(() => {
        setNewBadge(null);
    }, []);

    // Check if today's quota is complete
    const isDailyComplete = streak.count >= DAILY_QUOTA;

    // Progress towards daily goal
    const dailyProgress = Math.min(streak.count / DAILY_QUOTA, 1);

    // Get next badge info
    const getNextBadge = useCallback(() => {
        const milestones = Object.keys(BADGES).map(Number).sort((a, b) => a - b);
        const nextMilestone = milestones.find(m => streak.total < m);

        if (nextMilestone) {
            return {
                ...BADGES[nextMilestone],
                daysRemaining: nextMilestone - streak.total,
                milestone: nextMilestone,
            };
        }
        return null;
    }, [streak.total]);

    // Reset streak (for testing)
    const resetStreak = async () => {
        const newStreak = { count: 0, total: 0, date: null, max: 0 };
        setStreak(newStreak);
        setBadges([]);
        await saveStreakData(newStreak, []);
    };

    return {
        streak,
        badges,
        newBadge,
        isLoading,
        deviceId,
        isDailyComplete,
        dailyProgress,
        recordQuoteView,
        clearNewBadge,
        getNextBadge,
        resetStreak,
        DAILY_QUOTA,
    };
};

export default useStreak;
