// Quotiva Design System - Digital Twilight Theme
// Color palette optimized for quote reading and emotional resonance

export const colors = {
    // Core palette
    background: {
        primary: '#0F172A',      // Midnight Navy - main background
        secondary: '#1E293B',    // Slate - cards, modals
        tertiary: '#334155',     // Lighter slate - hover states
    },

    // Text colors
    text: {
        primary: '#FFFFFF',      // Pure White - quotes
        secondary: '#94A3B8',    // Sage Mist - secondary text
        tertiary: '#64748B',     // Dim - hints, placeholders
        accent: '#F59E0B',       // Soft Gold - highlights
    },

    // Accent colors
    accent: {
        gold: '#F59E0B',         // Primary accent - streaks, badges
        goldLight: '#FCD34D',    // Hover gold
        goldDark: '#D97706',     // Pressed gold
    },

    // Mood-based gradients
    gradients: {
        hope: ['#FB7185', '#FBBF24'],      // Coral → Gold
        melancholy: ['#334155', '#4338CA'], // Slate → Indigo
        energy: ['#8B5CF6', '#06B6D4'],     // Violet → Cyan
        calm: ['#10B981', '#14B8A6'],       // Emerald → Teal
        wisdom: ['#F59E0B', '#EF4444'],     // Gold → Red
        love: ['#EC4899', '#F43F5E'],       // Pink → Rose
    },

    // Particle colors
    particles: {
        firefly: '#FBBF24',      // Warm gold
        rain: '#60A5FA',         // Sky blue
        fog: '#94A3B8',          // Sage mist
        sparkle: '#FBBF24',      // Gold sparkle
    },

    // UI Elements
    ui: {
        success: '#10B981',      // Emerald
        warning: '#F59E0B',      // Amber
        error: '#EF4444',        // Red
        info: '#3B82F6',         // Blue
        border: 'rgba(148, 163, 184, 0.2)',
        overlay: 'rgba(15, 23, 42, 0.8)',
    },

    // Badge colors
    badges: {
        shayar: '#F59E0B',       // Gold
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

export default colors;
