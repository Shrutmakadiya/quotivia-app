// Splash Screen - Stitch & Soul Theme
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Theme colors
const COLORS = {
    primary: '#ee8c2b',
    backgroundLight: '#f8f7f6',
    backgroundDark: '#221910',
    textPrimary: '#1b140d',
    textSecondary: '#9a734c',
    patchBg: '#fcfaf8',
    patchBorder: '#e7dbcf',
    progressBg: '#e7dbcf',
};

const SplashScreen = ({ onFinish }) => {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Fade in and scale up animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Progress bar animation
        Animated.timing(progressAnim, {
            toValue: 100,
            duration: 2500,
            useNativeDriver: false,
        }).start(() => {
            // Finish splash after progress completes
            if (onFinish) {
                setTimeout(onFinish, 300);
            }
        });
    }, []);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            {/* Linen Texture Background */}
            <View style={styles.linenTexture} />

            {/* Corner Accents */}
            <View style={[styles.cornerAccent, styles.topLeft]} />
            <View style={[styles.cornerAccent, styles.topRight]} />
            <View style={[styles.cornerAccent, styles.bottomLeft]} />
            <View style={[styles.cornerAccent, styles.bottomRight]} />

            {/* Main Content */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    }
                ]}
            >
                {/* Logo Patch Container */}
                <View style={styles.patchContainer}>
                    {/* Outer Glow */}
                    <View style={styles.patchGlow} />

                    {/* The Embroidered Patch */}
                    <View style={styles.patch}>
                        {/* Stitched Inner Border */}
                        <View style={styles.stitchedBorder} />

                        {/* Central Icon */}
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name="chatbubble-ellipses"
                                size={64}
                                color={COLORS.primary}
                            />
                        </View>
                    </View>
                </View>

                {/* Branding */}
                <View style={styles.branding}>
                    <Text style={styles.title}>Quotivia</Text>
                    <Text style={styles.tagline}>Crafting your daily inspiration</Text>
                </View>
            </Animated.View>

            {/* Bottom Loading Section */}
            <View style={styles.loadingSection}>
                <Text style={styles.loadingText}>LOADING YOUR DAILY THREADS...</Text>

                {/* Progress Bar */}
                <View style={styles.progressBar}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            { width: progressWidth }
                        ]}
                    >
                        {/* Thread Texture */}
                        <View style={styles.threadTexture} />
                    </Animated.View>
                </View>
            </View>

            {/* Bottom Tag */}
            <Text style={styles.bottomTag}>PREMIUM HANDCRAFTED CONTENT</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    linenTexture: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.backgroundLight,
        // Simulating linen texture with subtle pattern
    },
    cornerAccent: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderColor: COLORS.primary + '30',
    },
    topLeft: {
        top: 60,
        left: 32,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderTopLeftRadius: 16,
    },
    topRight: {
        top: 60,
        right: 32,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderTopRightRadius: 16,
    },
    bottomLeft: {
        bottom: 60,
        left: 32,
        borderBottomWidth: 2,
        borderLeftWidth: 2,
        borderBottomLeftRadius: 16,
    },
    bottomRight: {
        bottom: 60,
        right: 32,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderBottomRightRadius: 16,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    patchContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    patchGlow: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: COLORS.primary + '15',
    },
    patch: {
        width: 192,
        height: 192,
        borderRadius: 96,
        backgroundColor: COLORS.patchBg,
        borderWidth: 4,
        borderColor: COLORS.patchBorder,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
        elevation: 10,
    },
    stitchedBorder: {
        position: 'absolute',
        width: 168,
        height: 168,
        borderRadius: 84,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        opacity: 0.6,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    branding: {
        marginTop: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textSecondary,
        marginTop: 8,
    },
    loadingSection: {
        position: 'absolute',
        bottom: 120,
        width: SCREEN_WIDTH - 80,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.textSecondary,
        letterSpacing: 2,
        marginBottom: 16,
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: COLORS.progressBg,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    threadTexture: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.3,
        // Thread texture effect
    },
    bottomTag: {
        position: 'absolute',
        bottom: 40,
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textSecondary + '50',
        letterSpacing: 3,
    },
});

export default SplashScreen;
