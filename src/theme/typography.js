// Quotiva Typography System
import { Platform } from 'react-native';

export const typography = {
    // Font families
    fonts: {
        // Quote display - serif for literary feel
        display: Platform.select({
            ios: 'Georgia',
            android: 'serif',
            default: 'Georgia'
        }),

        // UI text - clean sans-serif
        body: Platform.select({
            ios: 'System',
            android: 'Roboto',
            default: 'System'
        }),

        // Accent text - for special moments
        accent: Platform.select({
            ios: 'Noteworthy-Light',
            android: 'sans-serif-light',
            default: 'Noteworthy-Light'
        })
    },

    // Font sizes
    sizes: {
        // Display sizes (quotes)
        displayLarge: 32,
        displayMedium: 28,
        displaySmall: 24,

        // Heading sizes
        headingLarge: 22,
        headingMedium: 20,
        headingSmall: 18,

        // Body sizes
        bodyLarge: 16,
        bodyMedium: 14,
        bodySmall: 12,

        // Caption
        caption: 11,
    },

    // Line heights
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.8,
        loose: 2,
    },

    // Font weights (numeric for cross-platform)
    weights: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Letter spacing
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1,
    }
};

// Pre-composed text styles
export const textStyles = {
    // Quote text styles
    quoteText: {
        fontFamily: typography.fonts.display,
        fontSize: typography.sizes.displayMedium,
        fontWeight: typography.weights.regular,
        lineHeight: typography.sizes.displayMedium * typography.lineHeights.relaxed,
        letterSpacing: typography.letterSpacing.normal,
    },

    quoteAuthor: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.bodyLarge,
        fontWeight: typography.weights.medium,
        letterSpacing: typography.letterSpacing.wide,
    },

    // UI text styles
    heading: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.headingLarge,
        fontWeight: typography.weights.bold,
        letterSpacing: typography.letterSpacing.normal,
    },

    subheading: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.headingSmall,
        fontWeight: typography.weights.semibold,
    },

    body: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.bodyMedium,
        fontWeight: typography.weights.regular,
        lineHeight: typography.sizes.bodyMedium * typography.lineHeights.normal,
    },

    caption: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.caption,
        fontWeight: typography.weights.regular,
        letterSpacing: typography.letterSpacing.wide,
    },

    // Badge text
    badge: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.bodySmall,
        fontWeight: typography.weights.bold,
        letterSpacing: typography.letterSpacing.wider,
        textTransform: 'uppercase',
    }
};

export default typography;
