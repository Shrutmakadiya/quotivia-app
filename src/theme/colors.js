// Quotiva Design System - Warm Stitched Theme
// Color palette inspired by handcrafted fabric aesthetics with warm orange accents

export const colors = {
    // Core palette - Light Mode (Primary)
    background: {
        primary: '#f8f7f6',      // Warm cream - main background
        secondary: '#ffffff',    // Pure white - cards, modals
        tertiary: '#f2f0ed',     // Warm gray - hover states
        dark: '#1b140d',         // Dark chocolate - dark mode bg
        fabricDark: '#2d2218',   // Rich brown - dark mode cards
    },

    // Text colors
    text: {
        primary: '#1b140d',      // Dark chocolate - main text
        secondary: '#64748B',    // Slate - secondary text
        tertiary: '#94a3b8',     // Light slate - hints, placeholders
        accent: '#ee8c2b',       // Warm orange - highlights
        light: '#fcfaf8',        // Off-white - text on dark bg
    },

    // Accent colors - Primary brand color
    accent: {
        gold: '#ee8c2b',         // Primary warm orange - brand color
        goldLight: '#f5a85a',    // Hover orange
        goldDark: '#d97b1a',     // Pressed orange
    },

    // Category colors for quote filters
    categories: {
        motivation: {
            icon: '#5B8266',
            iconDark: '#A7C7B2',
            background: '#E8F3ED',
            backgroundDark: '#2D3833',
        },
        love: {
            icon: '#C87A75',
            iconDark: '#F3B7B3',
            background: '#FDF0EF',
            backgroundDark: '#3D2F2E',
        },
        success: {
            icon: '#A68966',
            iconDark: '#D9C5B2',
            background: '#F9F4EB',
            backgroundDark: '#3A352C',
        },
        life: {
            icon: '#718CA1',
            iconDark: '#B8CAD8',
            background: '#F0F4F8',
            backgroundDark: '#2C343D',
        },
        wisdom: {
            icon: '#8A7E94',
            iconDark: '#C5BDD1',
            background: '#F3F0F5',
            backgroundDark: '#343038',
        },
        creativity: {
            icon: '#BD9274',
            iconDark: '#E6C6B0',
            background: '#FDF4EE',
            backgroundDark: '#3D332D',
        },
    },

    // Mood-based gradients
    gradients: {
        hope: ['#FB7185', '#FBBF24'],      // Coral → Gold
        melancholy: ['#334155', '#4338CA'], // Slate → Indigo
        energy: ['#8B5CF6', '#06B6D4'],     // Violet → Cyan
        calm: ['#10B981', '#14B8A6'],       // Emerald → Teal
        wisdom: ['#ee8c2b', '#EF4444'],     // Orange → Red
        love: ['#EC4899', '#F43F5E'],       // Pink → Rose
    },

    // Particle colors
    particles: {
        firefly: '#ee8c2b',      // Warm orange
        rain: '#60A5FA',         // Sky blue
        fog: '#94A3B8',          // Sage mist
        sparkle: '#f5a85a',      // Light orange sparkle
    },

    // UI Elements
    ui: {
        success: '#10B981',      // Emerald
        warning: '#ee8c2b',      // Warm orange
        error: '#EF4444',        // Red
        info: '#3B82F6',         // Blue
        border: 'rgba(27, 20, 13, 0.1)',
        borderDashed: '#ee8c2b',  // Stitched border color
        overlay: 'rgba(27, 20, 13, 0.8)',
        overlayLight: 'rgba(248, 247, 246, 0.9)',
        tabBar: 'rgba(255, 255, 255, 0.9)',
        tabBarDark: 'rgba(45, 34, 24, 0.9)',
    },

    // Badge colors
    badges: {
        shayar: '#ee8c2b',       // Warm orange
        speaker: '#8B5CF6',      // Violet
        master: '#EF4444',       // Crimson
    }
};

// Mood to gradient mapping
export const getMoodGradient = (mood) => {
    return colors.gradients[mood] || colors.gradients.wisdom;
};

// Mood to particle color mapping  
export const getParticleColor = (particleTheme) => {
    return colors.particles[particleTheme] || colors.particles.firefly;
};

// Get category style
export const getCategoryStyle = (category) => {
    return colors.categories[category] || colors.categories.wisdom;
};

export default colors;
