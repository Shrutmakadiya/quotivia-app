// Streak Progress Bar Component - Expo Go Compatible
// Shows daily quote reading progress
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '../theme';

const DAILY_QUOTA = 4;
const CIRCLE_SIZE = 50;
const STROKE_WIDTH = 4;

const StreakBar = ({
    currentCount = 0,
    totalStreak = 0,
    style
}) => {
    const progress = Math.min(currentCount / DAILY_QUOTA, 1);
    const isComplete = currentCount >= DAILY_QUOTA;

    return (
        <View style={[styles.container, style]}>
            {/* Streak flame icon and count */}
            <View style={styles.streakInfo}>
                <Text style={styles.flameIcon}>🔥</Text>
                <Text style={styles.streakCount}>{totalStreak}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
            </View>

            {/* Circular progress - simplified version */}
            <View style={styles.progressContainer}>
                {/* Background circle */}
                <View style={styles.circleBackground} />

                {/* Progress overlay */}
                <View
                    style={[
                        styles.progressRing,
                        {
                            borderColor: isComplete ? colors.accent.gold : colors.accent.goldLight,
                            borderTopColor: 'transparent',
                            borderRightColor: progress > 0.25 ? (isComplete ? colors.accent.gold : colors.accent.goldLight) : 'transparent',
                            borderBottomColor: progress > 0.5 ? (isComplete ? colors.accent.gold : colors.accent.goldLight) : 'transparent',
                            borderLeftColor: progress > 0.75 ? (isComplete ? colors.accent.gold : colors.accent.goldLight) : 'transparent',
                            transform: [{ rotate: '-45deg' }],
                        }
                    ]}
                />

                {/* Center text */}
                <View style={styles.centerText}>
                    <Text style={[styles.progressText, isComplete && styles.progressComplete]}>
                        {currentCount}/{DAILY_QUOTA}
                    </Text>
                </View>
            </View>

            {/* Status text */}
            <Text style={styles.statusText}>
                {isComplete
                    ? '✨ Goal done!'
                    : `${DAILY_QUOTA - currentCount} more`
                }
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.ui.overlay,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 12,
    },
    streakInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    flameIcon: {
        fontSize: 20,
    },
    streakCount: {
        ...textStyles.heading,
        color: colors.accent.gold,
        fontSize: 18,
    },
    streakLabel: {
        ...textStyles.caption,
        color: colors.text.secondary,
    },
    progressContainer: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleBackground: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: CIRCLE_SIZE / 2,
        borderWidth: STROKE_WIDTH,
        borderColor: colors.background.tertiary,
    },
    progressRing: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: CIRCLE_SIZE / 2,
        borderWidth: STROKE_WIDTH,
    },
    centerText: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        ...textStyles.caption,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    progressComplete: {
        color: colors.accent.gold,
    },
    statusText: {
        ...textStyles.caption,
        color: colors.text.tertiary,
        flex: 1,
    },
});

export default StreakBar;
