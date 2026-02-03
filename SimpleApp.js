import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

export default function SimpleApp() {
    const opacity = useSharedValue(0.2);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container}>
            <Animated.Text style={[styles.text, animatedStyle]}>Quoat is running!</Animated.Text>
            <Text style={styles.subtext}>If this pulse works, Reanimated is healthy.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtext: {
        color: 'white',
        marginTop: 10,
    },
});
