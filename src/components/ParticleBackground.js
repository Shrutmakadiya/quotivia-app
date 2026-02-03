// Particle Background - Expo Go Compatible Version
// Uses Reanimated for animations instead of Skia for compatibility
import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { getParticleColor } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Generate random particles
const generateParticles = (count) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            id: i,
            x: Math.random() * SCREEN_WIDTH,
            y: Math.random() * SCREEN_HEIGHT,
            size: 3 + Math.random() * 6,
            delay: Math.random() * 2000,
            duration: 2000 + Math.random() * 3000,
        });
    }
    return particles;
};

// Single particle component
const Particle = ({ x, y, size, delay, duration, color, theme }) => {
    const opacity = useSharedValue(0.2);
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const scale = useSharedValue(0.8);

    useEffect(() => {
        // Fade animation
        opacity.value = withDelay(
            delay,
            withRepeat(
                withTiming(0.8, { duration: duration, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            )
        );

        // Scale animation
        scale.value = withDelay(
            delay,
            withRepeat(
                withTiming(1.3, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            )
        );

        // Movement based on theme
        if (theme === 'firefly') {
            translateY.value = withDelay(
                delay,
                withRepeat(
                    withTiming(-30, { duration: duration, easing: Easing.inOut(Easing.sine) }),
                    -1,
                    true
                )
            );
            translateX.value = withDelay(
                delay,
                withRepeat(
                    withTiming(20, { duration: duration * 1.2, easing: Easing.inOut(Easing.sine) }),
                    -1,
                    true
                )
            );
        } else if (theme === 'rain') {
            translateY.value = withRepeat(
                withTiming(SCREEN_HEIGHT, { duration: 3000, easing: Easing.linear }),
                -1,
                false
            );
        } else if (theme === 'fog') {
            translateX.value = withDelay(
                delay,
                withRepeat(
                    withTiming(100, { duration: duration * 2, easing: Easing.inOut(Easing.sine) }),
                    -1,
                    true
                )
            );
        }
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <Animated.View
            style={[
                styles.particle,
                {
                    left: x,
                    top: y,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                },
                animatedStyle,
            ]}
        />
    );
};

const ParticleBackground = ({ theme = 'firefly', intensity = 1 }) => {
    const particleColor = getParticleColor(theme);

    const particleCount = useMemo(() => {
        const baseCount = {
            firefly: 12,
            rain: 30,
            fog: 6,
            sparkle: 15,
        };
        return Math.round((baseCount[theme] || 12) * intensity);
    }, [theme, intensity]);

    const particles = useMemo(() => generateParticles(particleCount), [particleCount]);

    return (
        <View style={styles.container} pointerEvents="none">
            {particles.map((particle) => (
                <Particle
                    key={particle.id}
                    {...particle}
                    color={particleColor}
                    theme={theme}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    particle: {
        position: 'absolute',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
});

export default ParticleBackground;
