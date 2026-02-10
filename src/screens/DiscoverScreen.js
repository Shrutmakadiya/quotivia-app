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
import {
    ChevronLeft,
    Search,
    ArrowRight,
    Dumbbell,
    Heart,
    TrendingUp,
    BookOpen,
    Flower2,
    Palette
} from 'lucide-react-native';
import api from '../services/api';
import { colors, textStyles, borderRadius, spacing, getMoodGradient } from '../theme';

const FABRIC_PATCHES = [
    { id: 'motivation', label: 'Motivation', icon: Dumbbell, count: '128 Quotes', bg: '#dcf2e6', text: '#2d6a4f', iconColor: '#2d6a4f' },
    { id: 'love', label: 'Love', icon: Heart, count: '245 Quotes', bg: '#fce7f3', text: '#9d174d', iconColor: '#9d174d' },
    { id: 'success', label: 'Success', icon: TrendingUp, count: '89 Quotes', bg: '#e0f2fe', text: '#0369a1', iconColor: '#0369a1' },
    { id: 'wisdom', label: 'Wisdom', icon: BookOpen, count: '312 Quotes', bg: '#ede9fe', text: '#5b21b6', iconColor: '#5b21b6' },
    { id: 'peace', label: 'Peace', icon: Flower2, count: '156 Quotes', bg: '#ffedd5', text: '#9a3412', iconColor: '#9a3412' },
    { id: 'creativity', label: 'Creativity', icon: Palette, count: '67 Quotes', bg: '#fef9c3', text: '#854d0e', iconColor: '#854d0e' },
];

const CURATED_COLLECTIONS = [
    {
        id: 'morning',
        title: 'Morning Rituals',
        subtitle: 'Curated for your first 30 mins',
        tag: 'STAFF PICK',
        bg: 'rgba(238, 140, 43, 0.1)',
        borderColor: 'rgba(238, 140, 43, 0.3)',
        textColor: '#000000',
        tagColor: '#ee8c2b'
    },
    {
        id: 'midnight',
        title: 'Deep Reflection',
        subtitle: 'Wind down with ancient wisdom',
        tag: 'EVENING',
        bg: '#F4F4F5',
        borderColor: '#D4D4D8',
        textColor: '#000000',
        tagColor: '#71717A'
    },
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

// Fabric Patch Component
const FabricPatch = ({ patch, isSelected, onPress }) => (
    <Pressable
        style={[
            styles.fabricPatch,
            { backgroundColor: patch.bg, borderColor: isSelected ? patch.text : 'rgba(0,0,0,0.1)' }
        ]}
        onPress={() => onPress(patch.id)}
    >
        <View style={styles.patchIconContainer}>
            <patch.icon size={32} color={patch.iconColor} />
        </View>
        <Text style={[styles.patchLabel, { color: patch.text }]}>{patch.label}</Text>
        <Text style={[styles.patchCount, { color: patch.text, opacity: 0.7 }]}>{patch.count}</Text>
    </Pressable>
);

// Curated Collection Card
const CuratedCollectionCard = ({ collection, onPress }) => (
    <Pressable
        style={[
            styles.curatedCard,
            { backgroundColor: collection.bg, borderColor: collection.borderColor }
        ]}
        onPress={() => onPress && onPress(collection.id)}
    >
        <View style={styles.curatedContent}>
            <Text style={[styles.curatedTag, { color: collection.tagColor }]}>{collection.tag}</Text>
            <Text style={[styles.curatedTitle, { color: collection.textColor }]}>{collection.title}</Text>
            <Text style={[styles.curatedSubtitle, { color: collection.textColor }]}>{collection.subtitle}</Text>
        </View>
        {/* Decorative blur circle for the first card style */}
        {collection.id === 'morning' && (
            <View style={styles.blurCircle} />
        )}
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
        <View style={[styles.container]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={[styles.header, { marginTop: insets.top }]}>
                    <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={24} color={colors.text.primary} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Quote Search</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={22} color="#94A3B8" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Find a theme..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={handleSearch} style={styles.searchActionBtn}>
                                <ArrowRight size={20} color="#fff" />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Fabric Patches Grid */}
                <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                    <Text style={styles.sectionTitle}>Quote's Categories</Text>
                    <Text style={styles.sectionSubtitle}>DAILY INSPIRATION</Text>
                </View>

                <View style={styles.patchesGrid}>
                    {FABRIC_PATCHES.map((patch) => (
                        <FabricPatch
                            key={patch.id}
                            patch={patch}
                            isSelected={selectedMood === patch.id}
                            onPress={handleMoodSelect}
                        />
                    ))}
                </View>


                {/* Mood Quotes (if mood selected) */}
                {selectedMood && moodQuotes.length > 0 && (
                    <View style={styles.resultsSection}>
                        <Text style={styles.sectionTitle}>
                            {(() => {
                                if (selectedMood === 'search') return `Results for "${searchQuery}"`;
                                const patch = FABRIC_PATCHES.find(p => p.id === selectedMood);
                                if (patch) return `${patch.label} Quotes`;

                                const collection = CURATED_COLLECTIONS.find(c => c.id === selectedMood);
                                if (collection) return `${collection.title}`;

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

                {/* Hand-Stitched Collections */}
                <Text style={[styles.sectionTitle, { marginTop: 32, marginBottom: 16, paddingHorizontal: 4 }]}>Hand-Stitched Collections</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.collectionsScroll}
                >
                    {CURATED_COLLECTIONS.map((collection) => (
                        <CuratedCollectionCard
                            key={collection.id}
                            collection={collection}
                            onPress={handleMoodSelect}
                        />
                    ))}
                </ScrollView>

                {/* Trending */}
                <Text style={[styles.sectionTitle, { marginTop: 32, marginBottom: 16 }]}>🔥 Trending Now</Text>
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
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        marginBottom: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...textStyles.heading,
        fontSize: 20,
        fontWeight: '700',
        color: colors.text.primary,
        textAlign: 'center',
    },
    searchContainer: {
        marginBottom: 24,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: colors.ui.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchActionBtn: {
        backgroundColor: colors.accent.gold,
        borderRadius: 8,
        padding: 8,
        marginLeft: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text.primary,
        height: '100%',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
    },
    sectionSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.accent.gold,
        letterSpacing: 0.5,
    },
    patchesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    fabricPatch: {
        width: '47%',
        aspectRatio: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    patchIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    patchLabel: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    patchCount: {
        fontSize: 12,
        fontWeight: '500',
    },
    resultsSection: {
        marginTop: 0,
    },
    collectionsScroll: {
        gap: 16,
        paddingBottom: 8,
    },
    curatedCard: {
        width: 280,
        height: 176,
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'flex-end',
        overflow: 'hidden',
        position: 'relative',
    },
    curatedContent: {
        zIndex: 10,
    },
    curatedTag: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    curatedTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    curatedSubtitle: {
        fontSize: 14,
        opacity: 0.7,
    },
    blurCircle: {
        position: 'absolute',
        top: -16,
        right: -16,
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(238, 140, 43, 0.2)',
    },
    quoteList: {
        gap: 16,
        paddingVertical: 8,
    },
    quotePreview: {
        width: 280,
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 16,
    },
    quoteGradient: {
        padding: 20,
        minHeight: 150,
        justifyContent: 'center',
    },
    quotePreviewText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#fff',
        fontWeight: '500',
    },
    quotePreviewAuthor: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 12,
        fontWeight: '600',
    },
    loader: {
        marginVertical: 24,
    },
    bottomPadding: {
        height: 100,
    },
});

export default DiscoverScreen;
