// Full-screen Quote Card Component
// Combines particle background, kinetic typography, and gestures
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    runOnJS,
} from 'react-native-reanimated';
import {
    GestureDetector,
    Gesture
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import ParticleBackground from './ParticleBackground';
import KineticQuote from './KineticQuote';
import { colors, textStyles, getMoodGradient } from '../theme';
import { getQuoteBackgroundImage } from '../utils/imageMapper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const QuoteCard = ({
    quote,
    onSwipeUp,    // Next quote
    onSwipeDown,  // Author bio
    onSwipeLeft,  // Share
    onSwipeRight, // Save
    onQuoteRead,  // Track reading
    showAnimation = true,
    index,
}) => {
    const [animationComplete, setAnimationComplete] = useState(!showAnimation);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Gesture values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);

    // Default quote structure
    const quoteData = quote || {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        mood: "hope",
        particleTheme: "firefly",
    };

    const gradientColors = getMoodGradient(quoteData.mood);
    const backgroundImage = getQuoteBackgroundImage(quoteData);

    // Pan gesture for swipe actions
    const panGesture = Gesture.Pan()
        .onStart(() => {
            scale.value = withSpring(0.98);
        })
        .onUpdate((event) => {
            translateX.value = event.translationX * 0.5;
            translateY.value = event.translationY * 0.5;
        })
        .onEnd((event) => {
            const { translationX, translationY, velocityX, velocityY } = event;

            // Reset position
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            scale.value = withSpring(1);

            // Detect swipe direction
            const swipeThreshold = 50;
            const velocityThreshold = 200;

            // UP - Next quote
            if (translationY < -swipeThreshold || velocityY < -velocityThreshold) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                onSwipeUp && runOnJS(onSwipeUp)(quoteData);
            }
            // DOWN - Author bio
            else if (translationY > swipeThreshold || velocityY > velocityThreshold) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
                onSwipeDown && runOnJS(onSwipeDown)(quoteData);
            }
            // LEFT - Share
            else if (translationX < -swipeThreshold || velocityX < -velocityThreshold) {
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
                onSwipeLeft && runOnJS(onSwipeLeft)(quoteData);
            }
            // RIGHT - Save
            else if (translationX > swipeThreshold || velocityX > velocityThreshold) {
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
                onSwipeRight && runOnJS(onSwipeRight)(quoteData);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    const handleAnimationComplete = () => {
        setAnimationComplete(true);
        onQuoteRead && onQuoteRead(quoteData);
    };

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.container, animatedStyle]}>
                {/* Fallback gradient background (always visible behind image) */}
                <LinearGradient
                    colors={gradientColors}
                    style={StyleSheet.absoluteFill}
                />

                {/* Background Image - with caching and transition */}
                <Image
                    source={{ uri: backgroundImage }}
                    style={styles.backgroundImage}
                    contentFit="cover"
                    cachePolicy="disk"
                    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                    transition={300}
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => console.log('Image load error:', e.error)}
                />

                {/* Dark overlay for text readability */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)']}
                    style={StyleSheet.absoluteFill}
                />

                {/* Content layer */}
                <View style={styles.content}>
                    <View style={styles.quoteContainer}>
                        {showAnimation ? (
                            <KineticQuote
                                text={quoteData.text}
                                onComplete={handleAnimationComplete}
                            />
                        ) : (
                            <Text style={styles.quoteText}>{quoteData.text}</Text>
                        )}
                    </View>

                    <View style={styles.authorContainer}>
                        <View style={[styles.authorLine, { backgroundColor: gradientColors[0] }]} />
                        <Text style={styles.authorText}>— {quoteData.author}</Text>
                    </View>
                </View>

                {/* Swipe hints */}
                <View style={styles.hintsContainer}>
                    <Text style={styles.hintText}>↑ Next</Text>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: colors.background.primary,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    quoteContainer: {
        maxWidth: SCREEN_WIDTH - 48,
    },
    quoteText: {
        ...textStyles.quoteText,
        color: colors.text.primary,
        textAlign: 'center',
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
    },
    authorLine: {
        width: 30,
        height: 2,
        marginRight: 12,
        borderRadius: 1,
    },
    authorText: {
        ...textStyles.quoteAuthor,
        color: colors.text.secondary,
    },
    hintsContainer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    sideHints: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 30,
        marginTop: 8,
    },
    hintText: {
        ...textStyles.caption,
        color: colors.text.tertiary,
    },
});

export default QuoteCard;
