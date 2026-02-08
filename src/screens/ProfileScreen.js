// Profile Screen - Stats, Badges & Settings
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStreak } from '../hooks';
import BadgeRow from '../components/BadgeDisplay';
import api from '../services/api';
import { colors, textStyles, spacing, borderRadius } from '../theme';

// Stat card component
const StatCard = ({ value, label, icon }) => (
    <View style={styles.statCard}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// Settings row component
const SettingRow = ({ label, value, toggle, icon }) => (
    <View style={styles.settingRow}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={styles.settingLabel}>{label}</Text>
        {typeof value === 'boolean' ? (
            <Switch
                value={value}
                onValueChange={toggle}
                trackColor={{ false: colors.background.tertiary, true: colors.accent.gold }}
                thumbColor={colors.text.primary}
            />
        ) : (
            <Text style={styles.settingValue}>{value}</Text>
        )}
    </View>
);

const ProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    const { streak, badges, getNextBadge, DAILY_QUOTA, deviceId } = useStreak();


    const [createdQuotes, setCreatedQuotes] = useState([]);
    const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
    const [hapticEnabled, setHapticEnabled] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (deviceId) {
                loadCreatedQuotes();
            }
        }, [deviceId])
    );

    const loadCreatedQuotes = async () => {
        try {
            setIsLoadingQuotes(true);
            const quotes = await api.getUserCreatedQuotes(deviceId);
            setCreatedQuotes(quotes);
        } catch (error) {
            console.error('Failed to load created quotes:', error);
        } finally {
            setIsLoadingQuotes(false);
        }
    };

    const nextBadge = getNextBadge();

    // Calculate total stats
    const totalQuotesRead = streak.count + (streak.total * DAILY_QUOTA);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <Text style={styles.title}>Profile</Text>
                <Text style={styles.subtitle}>Your wisdom journey</Text>

                {/* Current Streak Banner */}
                <View style={styles.streakBanner}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <View style={styles.streakInfo}>
                        <Text style={styles.streakNumber}>{streak.total}</Text>
                        <Text style={styles.streakLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.streakDivider} />
                    <View style={styles.streakInfo}>
                        <Text style={styles.maxStreakNumber}>{streak.max}</Text>
                        <Text style={styles.streakLabel}>Best Streak</Text>
                    </View>
                </View>

                {/* Today's Progress */}
                <View style={styles.todayProgress}>
                    <Text style={styles.todayText}>Today's Progress</Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${Math.min((streak.count / DAILY_QUOTA) * 100, 100)}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {streak.count}/{DAILY_QUOTA} quotes read
                    </Text>
                </View>

                {/* Stats Grid */}
                <Text style={styles.sectionTitle}>📊 Your Stats</Text>
                <View style={styles.statsGrid}>
                    <StatCard value={totalQuotesRead} label="Quotes Read" icon="📖" />
                    <StatCard value={badges.length} label="Badges Earned" icon="🏆" />
                    <StatCard value={`${streak.max}`} label="Best Streak" icon="⭐" />
                    <StatCard value={createdQuotes.length} label="Created" icon="✍️" />
                </View>

                {/* My Creations Section */}
                {createdQuotes.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>✍️ My Creations</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.creationsList}
                        >
                            {createdQuotes.map((quote) => (
                                <View key={quote._id} style={styles.creationCard}>
                                    <Text style={styles.creationText} numberOfLines={3}>
                                        "{quote.text}"
                                    </Text>
                                    <View style={styles.creationFooter}>
                                        <Text style={styles.creationDate}>
                                            {new Date(quote.createdAt).toLocaleDateString()}
                                        </Text>
                                        <View style={styles.viewCount}>
                                            <Text style={styles.viewCountText}>👁️ {quote.viewCount || 0}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Badges Section */}
                <Text style={styles.sectionTitle}>🏅 Achievements</Text>
                <View style={styles.badgesContainer}>
                    <BadgeRow badges={badges} currentStreak={streak.total} />

                    {nextBadge && (
                        <View style={styles.nextBadgeInfo}>
                            <Text style={styles.nextBadgeText}>
                                {nextBadge.daysRemaining} days until {nextBadge.title} {nextBadge.icon}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Settings */}
                <Text style={styles.sectionTitle}>⚙️ Settings</Text>
                <View style={styles.settingsCard}>

                    <SettingRow
                        icon="📳"
                        label="Haptic Feedback"
                        value={hapticEnabled}
                        toggle={() => setHapticEnabled(!hapticEnabled)}
                    />
                    <View style={styles.settingDivider} />
                    <SettingRow
                        icon="🌙"
                        label="Theme"
                        value="light"
                    />
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appName}>Quotiva ✨</Text>
                    <Text style={styles.appVersion}>Version 1.0.0</Text>
                    <Text style={styles.tagline}>Daily inspiration for your soul</Text>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
    },
    title: {
        ...textStyles.heading,
        fontSize: 32,
        color: colors.text.primary,
        marginTop: spacing.lg,
    },
    subtitle: {
        ...textStyles.body,
        color: colors.text.secondary,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    streakBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    streakEmoji: {
        fontSize: 40,
        marginRight: spacing.md,
    },
    streakInfo: {
        flex: 1,
        alignItems: 'center',
    },
    streakNumber: {
        fontSize: 36,
        fontWeight: '700',
        color: colors.accent.gold,
    },
    maxStreakNumber: {
        fontSize: 36,
        fontWeight: '700',
        color: colors.text.primary,
    },
    streakLabel: {
        ...textStyles.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    streakDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.ui.border,
        marginHorizontal: spacing.md,
    },
    todayProgress: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    todayText: {
        ...textStyles.body,
        color: colors.text.primary,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.background.tertiary,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.accent.gold,
        borderRadius: 4,
    },
    progressText: {
        ...textStyles.caption,
        color: colors.text.secondary,
        marginTop: spacing.sm,
    },
    sectionTitle: {
        ...textStyles.subheading,
        color: colors.text.primary,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    statCard: {
        width: '48%',
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text.primary,
    },
    statLabel: {
        ...textStyles.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    badgesContainer: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    nextBadgeInfo: {
        marginTop: spacing.md,
        padding: spacing.sm,
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
    },
    nextBadgeText: {
        ...textStyles.caption,
        color: colors.accent.gold,
        fontWeight: '600',
    },
    settingsCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    settingIcon: {
        fontSize: 20,
        marginRight: spacing.md,
    },
    settingLabel: {
        ...textStyles.body,
        color: colors.text.primary,
        flex: 1,
    },
    settingValue: {
        ...textStyles.body,
        color: colors.text.secondary,
    },
    settingDivider: {
        height: 1,
        backgroundColor: colors.ui.border,
        marginVertical: spacing.xs,
    },
    appInfo: {
        alignItems: 'center',
        marginTop: spacing.xl,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.ui.border,
    },
    appName: {
        ...textStyles.heading,
        color: colors.accent.gold,
        fontSize: 18,
    },
    appVersion: {
        ...textStyles.caption,
        color: colors.text.tertiary,
        marginTop: spacing.xs,
    },
    tagline: {
        ...textStyles.body,
        color: colors.text.secondary,
        marginTop: spacing.sm,
        fontStyle: 'italic',
    },
    sectionContainer: {
        marginTop: spacing.lg,
    },
    creationsList: {
        gap: spacing.md,
        paddingLeft: spacing.xs,
    },
    creationCard: {
        width: 200,
        height: 120,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        justifyContent: 'space-between',
        borderLeftWidth: 3,
        borderLeftColor: colors.accent.gold,
    },
    creationText: {
        ...textStyles.caption,
        color: colors.text.primary,
        fontSize: 14,
        fontStyle: 'italic',
    },
    creationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    creationDate: {
        ...textStyles.caption,
        color: colors.text.tertiary,
        fontSize: 10,
    },
    viewCount: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewCountText: {
        ...textStyles.caption,
        color: colors.text.secondary,
        fontSize: 10,
    },
    bottomPadding: {
        height: 100,
    },
});

export default ProfileScreen;
