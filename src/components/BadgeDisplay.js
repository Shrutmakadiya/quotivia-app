// Badge Display Component
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
} from 'react-native-reanimated';
import { colors, textStyles, borderRadius } from '../theme';

const BADGES = {
    shayar: {
        id: 'shayar',
        title: 'Rising Shayar',
        icon: '✍️',
        days: 20,
        color: colors.badges.shayar,
        description: 'Completed 20-day streak'
    },
    speaker: {
        id: 'speaker',
        title: 'Motivational Speaker',
        icon: '🎤',
        days: 50,
        color: colors.badges.speaker,
        description: 'Completed 50-day streak'
    },
    master: {
        id: 'master',
        title: 'Wisdom Master',
        icon: '👑',
        days: 100,
        color: colors.badges.master,
        description: 'Completed 100-day streak'
    },
};

// Single badge component
const Badge = ({ badge, earned = false, onPress, size = 'medium' }) => {
    const scale = useSharedValue(1);
    const badgeInfo = BADGES[badge?.badgeId || badge] || BADGES.shayar;

    const sizeStyles = {
        small: { container: styles.badgeSmall, icon: styles.iconSmall, title: styles.titleSmall },
        medium: { container: styles.badgeMedium, icon: styles.iconMedium, title: styles.titleMedium },
        large: { container: styles.badgeLarge, icon: styles.iconLarge, title: styles.titleLarge },
    };

    const currentSize = sizeStyles[size];

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => onPress && onPress(badgeInfo)}
        >
            <Animated.View
                style={[
                    styles.badge,
                    currentSize.container,
                    earned && { borderColor: badgeInfo.color },
                    !earned && styles.badgeLocked,
                    animatedStyle,
                ]}
            >
                <Text style={[styles.badgeIcon, currentSize.icon, !earned && styles.lockedIcon]}>
                    {badgeInfo.icon}
                </Text>
                <Text style={[styles.badgeTitle, currentSize.title, !earned && styles.lockedText]}>
                    {badgeInfo.title}
                </Text>
                {!earned && (
                    <Text style={styles.daysText}>{badgeInfo.days} days</Text>
                )}
                {earned && badge.earnedAt && (
                    <Text style={styles.earnedDate}>
                        {new Date(badge.earnedAt).toLocaleDateString()}
                    </Text>
                )}
            </Animated.View>
        </Pressable>
    );
};

// Badge row showing all badges
const BadgeRow = ({ badges = [], currentStreak = 0, onBadgePress }) => {
    const earnedBadgeIds = badges.map(b => b.badgeId);

    return (
        <View style={styles.row}>
            {Object.values(BADGES).map((badgeInfo) => {
                const earnedBadge = badges.find(b => b.badgeId === badgeInfo.id);
                const isEarned = !!earnedBadge;
                const isNext = !isEarned && currentStreak < badgeInfo.days;

                return (
                    <Badge
                        key={badgeInfo.id}
                        badge={earnedBadge || badgeInfo.id}
                        earned={isEarned}
                        onPress={onBadgePress}
                        size="medium"
                    />
                );
            })}
        </View>
    );
};

// Badge unlock modal content
const BadgeUnlock = ({ badge }) => {
    const badgeInfo = BADGES[badge?.badgeId || badge] || badge;

    return (
        <View style={styles.unlockContainer}>
            <Text style={styles.unlockIcon}>{badgeInfo.icon}</Text>
            <Text style={styles.unlockTitle}>🎉 Badge Unlocked!</Text>
            <Text style={styles.unlockName}>{badgeInfo.title}</Text>
            <Text style={styles.unlockDesc}>{badgeInfo.description}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 12,
    },
    badge: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.background.tertiary,
        padding: 12,
    },
    badgeSmall: {
        width: 70,
        height: 80,
    },
    badgeMedium: {
        width: 100,
        height: 110,
    },
    badgeLarge: {
        width: 140,
        height: 150,
    },
    badgeLocked: {
        opacity: 0.5,
    },
    badgeIcon: {
        marginBottom: 4,
    },
    iconSmall: { fontSize: 24 },
    iconMedium: { fontSize: 32 },
    iconLarge: { fontSize: 48 },
    lockedIcon: {
        opacity: 0.4,
    },
    badgeTitle: {
        ...textStyles.caption,
        color: colors.text.primary,
        textAlign: 'center',
        fontWeight: '600',
    },
    titleSmall: { fontSize: 9 },
    titleMedium: { fontSize: 10 },
    titleLarge: { fontSize: 12 },
    lockedText: {
        color: colors.text.tertiary,
    },
    daysText: {
        ...textStyles.caption,
        color: colors.text.tertiary,
        fontSize: 9,
        marginTop: 2,
    },
    earnedDate: {
        ...textStyles.caption,
        color: colors.accent.gold,
        fontSize: 8,
        marginTop: 2,
    },
    unlockContainer: {
        alignItems: 'center',
        padding: 24,
    },
    unlockIcon: {
        fontSize: 80,
        marginBottom: 16,
    },
    unlockTitle: {
        ...textStyles.heading,
        color: colors.accent.gold,
        marginBottom: 8,
    },
    unlockName: {
        ...textStyles.subheading,
        color: colors.text.primary,
        marginBottom: 4,
    },
    unlockDesc: {
        ...textStyles.body,
        color: colors.text.secondary,
        textAlign: 'center',
    },
});

export { Badge, BadgeRow, BadgeUnlock, BADGES };
export default BadgeRow;
