// Discover Screen - Trending & Collections
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    Pressable,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { colors, textStyles, borderRadius, spacing, getMoodGradient } from '../theme';

const MOODS = [
    { id: 'hope', label: 'Hope', emoji: '🌅' },
    { id: 'calm', label: 'Calm', emoji: '🧘' },
    { id: 'energy', label: 'Energy', emoji: '⚡' },
    { id: 'wisdom', label: 'Wisdom', emoji: '📚' },
    { id: 'love', label: 'Love', emoji: '💕' },
    { id: 'melancholy', label: 'Reflect', emoji: '🌧️' },
];

const COLLECTIONS = [
    { id: 'midnight', name: 'Midnight Thoughts', emoji: '🌙', color: '#4338CA' },
    { id: 'morning', name: 'Morning Motivation', emoji: '☀️', color: '#F59E0B' },
    { id: 'stoic', name: 'Stoic Wisdom', emoji: '🏛️', color: '#64748B' },
    { id: 'rumi', name: "Rumi's Poetry", emoji: '✨', color: '#EC4899' },
];

// Quote preview card
const QuotePreview = ({ quote, onPress }) => (
    <Pressable
        style={styles.quotePreview}
        onPress={() => onPress && onPress(quote)}
    >
        <LinearGradient
            colors={getMoodGradient(quote.mood)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quoteGradient}
        >
            <Text style={styles.quotePreviewText} numberOfLines={3}>
                "{quote.text}"
            </Text>
            <Text style={styles.quotePreviewAuthor}>— {quote.author}</Text>
        </LinearGradient>
    </Pressable>
);

// Mood filter chip
const MoodChip = ({ mood, isSelected, onPress }) => (
    <Pressable
        style={[styles.moodChip, isSelected && styles.moodChipSelected]}
        onPress={() => onPress(mood.id)}
    >
        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
        <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
            {mood.label}
        </Text>
    </Pressable>
);

// Collection card
const CollectionCard = ({ collection, onPress }) => (
    <Pressable
        style={[styles.collectionCard, { backgroundColor: collection.color }]}
        onPress={() => onPress && onPress(collection)}
    >
        <Text style={styles.collectionEmoji}>{collection.emoji}</Text>
        <Text style={styles.collectionName}>{collection.name}</Text>
    </Pressable>
);

const DiscoverScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMood, setSelectedMood] = useState(null);
    const [trendingQuotes, setTrendingQuotes] = useState([]);
    const [moodQuotes, setMoodQuotes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchTrending();
    }, []);

    useEffect(() => {
        if (selectedMood) {
            fetchMoodQuotes(selectedMood);
        }
    }, [selectedMood]);

    const fetchTrending = async () => {
        try {
            setIsLoading(true);
            const quotes = await api.getTrendingQuotes();
            setTrendingQuotes(quotes.slice(0, 10));
        } catch (error) {
            console.log('Failed to fetch trending:', error);
            // Use placeholder data
            setTrendingQuotes([
                { _id: '1', text: "The only way to do great work is to love what you do.", author: "Steve Jobs", mood: "hope" },
                { _id: '2', text: "What you seek is seeking you.", author: "Rumi", mood: "wisdom" },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMoodQuotes = async (moodId) => {
        try {
            let quotes = [];

            // value mapping for collections to API calls
            switch (moodId) {
                case 'rumi':
                    quotes = await api.searchQuotes('Rumi');
                    break;
                case 'stoic':
                    quotes = await api.searchQuotes('Marcus'); // Marcus Aurelius
                    break;
                case 'morning':
                    // Map morning to energy or motivation search
                    quotes = await api.searchQuotes('Motivation');
                    if (!quotes || quotes.length === 0) {
                        quotes = await api.getQuotesByMood('energy');
                    }
                    break;
                case 'midnight':
                    // Map midnight to melancholy
                    quotes = await api.getQuotesByMood('melancholy');
                    break;
                default:
                    // Default behavior for normal moods
                    quotes = await api.getQuotesByMood(moodId);
                    break;
            }

            setMoodQuotes(quotes);
        } catch (error) {
            console.log('Failed to fetch mood/collection quotes:', error);
            // Fallback data so the UI still works even if backend is unreachable
            setMoodQuotes([
                { _id: `err_${moodId}_1`, text: "The obstacle is the way.", author: "Marcus Aurelius", mood: "wisdom" },
                { _id: `err_${moodId}_2`, text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", mood: "wisdom" },
                { _id: `err_${moodId}_3`, text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", mood: "wisdom" },
            ]);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const results = await api.searchQuotes(searchQuery);
            setMoodQuotes(results);
            setSelectedMood('search');
        } catch (error) {
            console.log('Search failed:', error);
        }
    };

    const handleMoodSelect = (moodId) => {
        if (selectedMood === 'search') {
            setSearchQuery('');
        }
        setSelectedMood(moodId === selectedMood ? null : moodId);
    };

    const handleQuotePress = (quote) => {
        // Navigate to home with this quote
        navigation.navigate('Home', { focusQuote: quote });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <Text style={styles.title}>Discover</Text>
                <Text style={styles.subtitle}>Find your perfect quote</Text>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search quotes..."
                        placeholderTextColor={colors.text.tertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    <Pressable style={styles.searchButton} onPress={handleSearch}>
                        <Text style={styles.searchButtonIcon}>🔍</Text>
                    </Pressable>
                </View>

                {/* Mood Filters */}
                <Text style={styles.sectionTitle}>Browse by Mood</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.moodList}
                >
                    {MOODS.map((mood) => (
                        <MoodChip
                            key={mood.id}
                            mood={mood}
                            isSelected={selectedMood === mood.id}
                            onPress={handleMoodSelect}
                        />
                    ))}
                </ScrollView>

                {/* Mood Quotes (if mood selected) */}
                {selectedMood && moodQuotes.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {(() => {
                                if (selectedMood === 'search') return `Results for "${searchQuery}"`;
                                const moodItem = MOODS.find(m => m.id === selectedMood);
                                if (moodItem) return `${moodItem.emoji} ${moodItem.label} Quotes`;

                                const collectionItem = COLLECTIONS.find(c => c.id === selectedMood);
                                if (collectionItem) return `${collectionItem.emoji} ${collectionItem.name} Quotes`;

                                return 'Selected Quotes';
                            })()}
                        </Text>
                        <FlatList
                            horizontal
                            data={moodQuotes}
                            renderItem={({ item }) => (
                                <QuotePreview quote={item} onPress={handleQuotePress} />
                            )}
                            keyExtractor={(item) => item._id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.quoteList}
                        />
                    </View>
                )}

                {/* Collections */}
                <Text style={styles.sectionTitle}>Curated Collections</Text>
                <View style={styles.collectionsGrid}>
                    {COLLECTIONS.map((collection) => (
                        <CollectionCard
                            key={collection.id}
                            collection={collection}
                            onPress={() => handleMoodSelect(collection.id)}
                        />
                    ))}
                </View>

                {/* Trending */}
                <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
                {isLoading ? (
                    <ActivityIndicator color={colors.accent.gold} style={styles.loader} />
                ) : (
                    <FlatList
                        horizontal
                        data={trendingQuotes}
                        renderItem={({ item }) => (
                            <QuotePreview quote={item} onPress={handleQuotePress} />
                        )}
                        keyExtractor={(item) => item._id}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quoteList}
                    />
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
    },
    title: {
        ...textStyles.heading,
        fontSize: 32,
        color: colors.text.primary,
        marginTop: spacing.lg,
    },
    subtitle: {
        ...textStyles.body,
        color: colors.text.secondary,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    searchContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    searchInput: {
        flex: 1,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        color: colors.text.primary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.ui.border,
    },
    searchButton: {
        backgroundColor: colors.accent.gold,
        borderRadius: borderRadius.lg,
        width: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonIcon: {
        fontSize: 20,
    },
    sectionTitle: {
        ...textStyles.subheading,
        color: colors.text.primary,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    section: {
        marginTop: spacing.sm,
    },
    moodList: {
        gap: spacing.sm,
        paddingVertical: spacing.xs,
    },
    moodChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: colors.ui.border,
    },
    moodChipSelected: {
        backgroundColor: colors.accent.gold,
        borderColor: colors.accent.gold,
    },
    moodEmoji: {
        fontSize: 16,
    },
    moodLabel: {
        ...textStyles.caption,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    moodLabelSelected: {
        color: colors.background.primary,
    },
    quoteList: {
        gap: spacing.md,
        paddingVertical: spacing.xs,
    },
    quotePreview: {
        width: 280,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    quoteGradient: {
        padding: spacing.md,
        minHeight: 150,
        justifyContent: 'center',
    },
    quotePreviewText: {
        ...textStyles.body,
        color: colors.text.primary,
        fontSize: 15,
        lineHeight: 22,
    },
    quotePreviewAuthor: {
        ...textStyles.caption,
        color: 'rgba(255,255,255,0.8)',
        marginTop: spacing.sm,
        fontWeight: '600',
    },
    collectionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    collectionCard: {
        width: '47%',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        minHeight: 100,
        justifyContent: 'flex-end',
    },
    collectionEmoji: {
        fontSize: 32,
        marginBottom: spacing.sm,
    },
    collectionName: {
        ...textStyles.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
    loader: {
        marginVertical: spacing.lg,
    },
    bottomPadding: {
        height: 100,
    },
});

export default DiscoverScreen;
