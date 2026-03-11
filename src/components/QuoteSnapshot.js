// Quote Snapshot Component
// A capture-ready version of the quote card for sharing/saving as image
import React, { forwardRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ImageBackground,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, textStyles } from '../theme';
import { getQuoteBackgroundImage } from '../utils/imageMapper';
import { getQuoteImageSource } from '../assets/quotes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SNAPSHOT_SIZE = SCREEN_WIDTH; // Default square image size
const BRAND_ICON = require('../../assets/icon.png');

const QuoteSnapshot = forwardRef(({ quote, style, onReady, size = SNAPSHOT_SIZE }, ref) => {
    const quoteData = quote || {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        mood: "hope",
    };

    const fallbackBackgroundImage = getQuoteBackgroundImage(quoteData);
    const quoteImageSource = getQuoteImageSource(quoteData.imageUrl);
    const backgroundSource = quoteImageSource || { uri: fallbackBackgroundImage };
    const hasText = Boolean(quoteData.text && quoteData.text.trim());

    return (
        <View ref={ref} style={[styles.container, { width: size, height: size }, style]} collapsable={false}>
            <ImageBackground
                source={backgroundSource}
                style={styles.imageBackground}
                resizeMode="cover"
                onLoadEnd={onReady}
                onError={onReady}
            >
                {/* Dark overlay for text readability */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.18)']}
                    style={styles.overlay}
                >
                    {/* Quote content */}
                    <View style={styles.content}>
                        <View style={[styles.quoteContainer, { maxWidth: size - 64 }]}>
                            {hasText && (
                                <>
                                    <Text style={styles.openQuote}>"</Text>
                                    <Text style={styles.quoteText}>{quoteData.text}</Text>
                                    <Text style={styles.closeQuote}>"</Text>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Branding */}
                    <View style={styles.branding}>
                        <View style={styles.brandBadge}>
                            <Image
                                source={BRAND_ICON}
                                style={styles.brandIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.brandText}>QuotesHub</Text>
                        </View>
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
    branding: {
        position: 'absolute',
        bottom: 24,
        right: 24,
    },
    brandBadge: {
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandIcon: {
        width: 16,
        height: 16,
        borderRadius: 4,
        marginRight: 6,
    },
    brandText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.92)',
        fontWeight: '600',
        letterSpacing: 0.4,
    },
});

export default QuoteSnapshot;
