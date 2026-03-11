// Streak Management Hook
// Handles daily quote tracking, streak calculation, and badge unlocking
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const [reviveOffer, setReviveOffer] = useState({
        available: false,
        previousTotal: 0,
        brokenAt: null,
        expiresAt: null,
    });

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
                if (parsed.reviveOffer) {
                    const expiresAt = parsed.reviveOffer.expiresAt
                        ? new Date(parsed.reviveOffer.expiresAt).getTime()
                        : 0;
                    if (expiresAt > Date.now() && parsed.reviveOffer.available) {
                        setReviveOffer(parsed.reviveOffer);
                    } else {
                        setReviveOffer({
                            available: false,
                            previousTotal: 0,
                            brokenAt: null,
                            expiresAt: null,
                        });
                    }
                }
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
    const saveStreakData = useCallback(async (newStreak, newBadges = badges, nextReviveOffer = reviveOffer) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                streak: newStreak,
                badges: newBadges,
                reviveOffer: nextReviveOffer,
            }));
        } catch (error) {
            console.error('Failed to save streak data:', error);
        }
    }, [badges, reviveOffer]);

    // Record a quote view (called when user reads a quote)
    const recordQuoteView = useCallback(async (quoteId) => {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const today = todayDate.toDateString();
        const oneDayMs = 1000 * 60 * 60 * 24;

        setStreak(prevStreak => {
            let newStreak = { ...prevStreak };
            let nextReviveOffer = reviveOffer;
            let nextBadges = badges;

            // Check if it's a new day
            if (newStreak.date !== today) {
                if (newStreak.date) {
                    const lastDate = new Date(newStreak.date);
                    lastDate.setHours(0, 0, 0, 0);
                    const diffDays = Math.floor((todayDate - lastDate) / oneDayMs);

                    if (diffDays > 1 || (diffDays === 1 && newStreak.count < DAILY_QUOTA)) {
                        // Streak broken - missed a day
                        const endOfToday = new Date(todayDate);
                        endOfToday.setHours(23, 59, 59, 999);
                        nextReviveOffer = {
                            available: newStreak.total > 0,
                            previousTotal: newStreak.total,
                            brokenAt: new Date().toISOString(),
                            expiresAt: endOfToday.toISOString(),
                        };
                        setReviveOffer(nextReviveOffer);
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
            if (newStreak.count === DAILY_QUOTA) {
                newStreak.total += 1;

                // Check for badge unlock
                const badge = BADGES[newStreak.total];
                if (badge && !badges.find(b => b.id === badge.id)) {
                    const newBadgeData = { ...badge, earnedAt: new Date().toISOString() };
                    setBadges(prev => [...prev, newBadgeData]);
                    setNewBadge(newBadgeData);
                    nextBadges = [...badges, newBadgeData];

                    // Sync badge to server
                    if (deviceId) {
                        api.syncStreak(deviceId, newStreak).catch(console.error);
                    }
                }
            }

            if (newStreak.total > newStreak.max) {
                newStreak.max = newStreak.total;
            }

            // Save to storage
            saveStreakData(newStreak, nextBadges, nextReviveOffer);

            // Sync to server (non-blocking)
            if (deviceId && quoteId) {
                api.recordQuoteView(deviceId, quoteId).catch(console.error);
            }

            return newStreak;
        });
    }, [badges, deviceId, reviveOffer, saveStreakData]);

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
        const clearedReviveOffer = { available: false, previousTotal: 0, brokenAt: null, expiresAt: null };
        setReviveOffer(clearedReviveOffer);
        await saveStreakData(newStreak, [], clearedReviveOffer);
    };

    const canReviveStreak = reviveOffer.available
        && reviveOffer.previousTotal > 0
        && reviveOffer.expiresAt
        && new Date(reviveOffer.expiresAt).getTime() > Date.now();

    const reviveStreak = useCallback(async () => {
        if (!canReviveStreak) return false;

        const revivedStreak = {
            ...streak,
            total: Math.max(streak.total, reviveOffer.previousTotal),
            max: Math.max(streak.max, reviveOffer.previousTotal),
        };

        const nextReviveOffer = {
            available: false,
            previousTotal: 0,
            brokenAt: null,
            expiresAt: null,
        };

        setStreak(revivedStreak);
        setReviveOffer(nextReviveOffer);
        await saveStreakData(revivedStreak, badges, nextReviveOffer);

        if (deviceId) {
            api.syncStreak(deviceId, revivedStreak).catch(console.error);
        }

        return true;
    }, [badges, canReviveStreak, deviceId, reviveOffer.previousTotal, saveStreakData, streak]);

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
        reviveOffer,
        canReviveStreak,
        reviveStreak,
        DAILY_QUOTA,
    };
};

export default useStreak;
