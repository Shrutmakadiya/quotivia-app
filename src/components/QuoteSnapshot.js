// Quote Snapshot Component
// A capture-ready version of the quote card for sharing/saving as image
import React, { forwardRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, textStyles, getMoodGradient } from '../theme';
import { getQuoteBackgroundImage } from '../utils/imageMapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SNAPSHOT_SIZE = SCREEN_WIDTH; // Square image for sharing

const QuoteSnapshot = forwardRef(({ quote, style }, ref) => {
    const quoteData = quote || {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        mood: "hope",
    };

    const backgroundImage = getQuoteBackgroundImage(quoteData);
    const gradientColors = getMoodGradient(quoteData.mood);

    return (
        <View ref={ref} style={[styles.container, style]} collapsable={false}>
            <ImageBackground
                source={{ uri: backgroundImage }}
                style={styles.imageBackground}
                resizeMode="cover"
            >
                {/* Dark overlay for text readability */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)']}
                    style={styles.overlay}
                >
                    {/* Quote content */}
                    <View style={styles.content}>
                        <View style={styles.quoteContainer}>
                            <Text style={styles.openQuote}>"</Text>
                            <Text style={styles.quoteText}>{quoteData.text}</Text>
                            <Text style={styles.closeQuote}>"</Text>
                        </View>

                        <View style={styles.authorContainer}>
                            <View style={[styles.authorLine, { backgroundColor: gradientColors[0] }]} />
                            <Text style={styles.authorText}>— {quoteData.author}</Text>
                        </View>
                    </View>

                    {/* Branding */}
                    <View style={styles.branding}>
                        <Text style={styles.brandText}>✨ Quotiva</Text>
                    </View>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: SNAPSHOT_SIZE,
        height: SNAPSHOT_SIZE,
        backgroundColor: colors.background.primary,
    },
    imageBackground: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quoteContainer: {
        maxWidth: SNAPSHOT_SIZE - 64,
        alignItems: 'center',
    },
    openQuote: {
        fontSize: 60,
        color: 'rgba(255,255,255,0.3)',
        fontFamily: 'Georgia',
        marginBottom: -20,
        alignSelf: 'flex-start',
    },
    closeQuote: {
        fontSize: 60,
        color: 'rgba(255,255,255,0.3)',
        fontFamily: 'Georgia',
        marginTop: -20,
        alignSelf: 'flex-end',
    },
    quoteText: {
        ...textStyles.quoteText,
        color: colors.text.primary,
        textAlign: 'center',
        lineHeight: 36,
        paddingHorizontal: 16,
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
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
    branding: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
    },
    brandText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
        letterSpacing: 1,
    },
});

export default QuoteSnapshot;
