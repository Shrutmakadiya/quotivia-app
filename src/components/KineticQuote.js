// Kinetic Typography Component
// Words appear sequentially with haptic feedback
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
    withSpring,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, textStyles } from '../theme';

const WORD_DELAY = 120; // ms between words
const ANIMATION_DURATION = 400;

const AnimatedWord = ({ word, index, totalWords, onReveal }) => {
    const delay = index * WORD_DELAY;
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        // Start animation with delay
        opacity.value = withDelay(delay,
            withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) })
        );

        translateY.value = withDelay(delay,
            withSpring(0, { damping: 12, stiffness: 100 })
        );

        scale.value = withDelay(delay,
            withSpring(1, { damping: 10, stiffness: 120 })
        );

        // Trigger haptic after delay
        const hapticTimer = setTimeout(() => {
            if (onReveal) {
                onReveal(index);
            }
        }, delay);

        return () => clearTimeout(hapticTimer);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    // Add punctuation-aware spacing
    const needsNoSpace = word.match(/^[.,!?;:]$/);
    const isLastWord = index === totalWords - 1;

    return (
        <Animated.Text style={[styles.word, animatedStyle]}>
            {word}{!isLastWord && !needsNoSpace ? ' ' : ''}
        </Animated.Text>
    );
};

const KineticQuote = ({
    text,
    style,
    onComplete,
    hapticEnabled = true,
    animationSpeed = 1
}) => {
    // Split text into words, keeping punctuation attached
    const words = useMemo(() => {
        if (!text) return [];
        return text.split(/\s+/).filter(w => w.length > 0);
    }, [text]);

    const handleWordReveal = async (index) => {
        if (hapticEnabled) {
            try {
                // Light haptic for each word
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (e) {
                // Haptics not available
            }
        }

        // Notify when all words revealed
        if (index === words.length - 1 && onComplete) {
            setTimeout(onComplete, 200);
        }
    };

    if (!words.length) return null;

    return (
        <View style={[styles.container, style]}>
            <View style={styles.textContainer}>
                {words.map((word, index) => (
                    <AnimatedWord
                        key={`${word}-${index}`}
                        word={word}
                        index={index}
                        totalWords={words.length}
                        onReveal={handleWordReveal}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
    },
    textContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
    },
    word: {
        ...textStyles.quoteText,
        color: colors.text.primary,
        textAlign: 'center',
    },
});

export default KineticQuote;
