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
    ActivityIndicator,
    Image,
    Alert,
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
import { useMonetization, useStreak } from '../hooks';
import ManagedBannerAd from '../components/ManagedBannerAd';
import { preloadManagedRewarded, showManagedRewarded } from '../services/adManager';
import { colors, textStyles, borderRadius, spacing, getMoodGradient } from '../theme';
import { getQuoteImageSource } from '../assets/quotes';

const BASE_FABRIC_PATCHES = [
    { id: 'motivation', label: 'Motivation', icon: Dumbbell, count: 0, bg: '#dcf2e6', text: '#2d6a4f', iconColor: '#2d6a4f' },
    { id: 'love', label: 'Love', icon: Heart, count: 0, bg: '#fce7f3', text: '#9d174d', iconColor: '#9d174d' },
    { id: 'success', label: 'Success', icon: TrendingUp, count: 0, bg: '#e0f2fe', text: '#0369a1', iconColor: '#0369a1' },
    { id: 'wisdom', label: 'Wisdom', icon: BookOpen, count: 0, bg: '#ede9fe', text: '#5b21b6', iconColor: '#5b21b6' },
    { id: 'life', label: 'Life', icon: Flower2, count: 0, bg: '#ffedd5', text: '#9a3412', iconColor: '#9a3412' },
    { id: 'creative', label: 'Creativity', icon: Palette, count: 0, bg: '#fef9c3', text: '#854d0e', iconColor: '#854d0e' },
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
const QuotePreview = ({ quote, onPress }) => {
    const imageSource = getQuoteImageSource(quote.imageUrl);
    
    return (
        <Pressable
            style={styles.quotePreview}
            onPress={() => onPress && onPress(quote)}
        >
            {imageSource ? (
                <View style={styles.imagePreviewContainer}>
                    <Image
                        source={imageSource}
                        style={styles.imagePreview}
                        resizeMode="cover"
                    />
                    <View style={styles.imagePreviewOverlay}>
                        <Text style={styles.imagePreviewText} numberOfLines={2}>
                            {quote.text}
                        </Text>
                        <Text style={styles.imagePreviewAuthor}>— {quote.author}</Text>
                    </View>
                </View>
            ) : (
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
            )}
        </Pressable>
    );
};

// Fabric Patch Component
const FabricPatch = ({ patch, isSelected, onPress }) => {
    const countText = Number.isFinite(patch.count)
        ? `${patch.count} Quote${patch.count === 1 ? '' : 's'}`
        : patch.count;

    return (
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
            <Text style={[styles.patchCount, { color: patch.text, opacity: 0.7 }]}>{countText}</Text>
        </Pressable>
    );
};

// Curated Collection Card
// const CuratedCollectionCard = ({ collection, onPress }) => (
//     <Pressable
//         style={[
//             styles.curatedCard,
//             { backgroundColor: collection.bg, borderColor: collection.borderColor }
//         ]}
//         onPress={() => onPress && onPress(collection.id)}
//     >
//         <View style={styles.curatedContent}>
//             <Text style={[styles.curatedTag, { color: collection.tagColor }]}>{collection.tag}</Text>
//             <Text style={[styles.curatedTitle, { color: collection.textColor }]}>{collection.title}</Text>
//             <Text style={[styles.curatedSubtitle, { color: collection.textColor }]}>{collection.subtitle}</Text>
//         </View>
//         {/* Decorative blur circle for the first card style */}
//         {collection.id === 'morning' && (
//             <View style={styles.blurCircle} />
//         )}
//     </Pressable>
// );

const DiscoverScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSearchQuery, setLastSearchQuery] = useState('');
    const [selectedMood, setSelectedMood] = useState(null);
    const [fabricPatches, setFabricPatches] = useState(BASE_FABRIC_PATCHES);
    const [trendingQuotes, setTrendingQuotes] = useState([]);
    const [moodQuotes, setMoodQuotes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isTrendingUnlocking, setIsTrendingUnlocking] = useState(false);
    const [trendingUnlocked, setTrendingUnlocked] = useState(false);
    const { deviceId } = useStreak();
    const { config: monetizationConfig, isLoading: monetizationLoading } = useMonetization(deviceId);

    useEffect(() => {
        fetchTrending();
        fetchCategoryCounts();
    }, []);

    useEffect(() => {
        if (selectedMood && selectedMood !== 'search') {
            fetchMoodQuotes(selectedMood);
        }
    }, [selectedMood]);

    useEffect(() => {
        if (monetizationLoading) return;
        if (!monetizationConfig?.globalEnabled || monetizationConfig?.blockedForDevice) return;

        preloadManagedRewarded({
            config: monetizationConfig,
            deviceId,
            placement: 'trendingRewarded',
        });
    }, [deviceId, monetizationConfig, monetizationLoading]);

    const fetchTrending = async () => {
        try {
            setIsLoading(true);
            const data = await api.getTrendingQuotes();
            const quotes = Array.isArray(data) ? data : (data?.quotes || []);
            setTrendingQuotes(quotes.slice(0, 30));
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

    const fetchCategoryCounts = async () => {
        try {
            const data = await api.getCategoryCounts();
            const counts = data && data.counts ? data.counts : {};
            const normalizedCounts = Object.keys(counts).reduce((acc, key) => {
                acc[key.toLowerCase()] = counts[key];
                return acc;
            }, {});
            setFabricPatches(prev =>
                prev.map(patch => ({
                    ...patch,
                    count: normalizedCounts[patch.id] ?? 0,
                }))
            );
        } catch (error) {
            console.log('Failed to fetch category counts:', error);
        }
    };

    const fetchMoodQuotes = async (moodId) => {
        try {
            let quotes = [];

            // Map frontend categories to backend queries
            const moodMap = {
                'peace': 'calm',
                'motivation': 'energy',
                'success': 'hope',
                'creative': 'hope',
            };

            // Curated collections mapping
            const collectionMap = {
                'morning': 'energy',
                'midnight': 'melancholy',
                'rumi': null, // uses search
                'stoic': null, // uses search
            };

            // Direct mood match
            const validMoods = ['hope', 'melancholy', 'calm', 'energy', 'wisdom', 'love'];
            
            if (validMoods.includes(moodId)) {
                // Use mood endpoint for valid moods
                quotes = await api.getQuotesByMood(moodId);
            } else if (moodMap[moodId]) {
                // Use mapped mood
                quotes = await api.getQuotesByMood(moodMap[moodId]);
            } else if (moodId === 'rumi') {
                quotes = await api.searchQuotes('Rumi');
            } else if (moodId === 'stoic') {
                quotes = await api.searchQuotes('Marcus');
            } else {
                // Use category endpoint or search for others
                try {
                    quotes = await api.getQuotesByCategory(moodId);
                } catch (err) {
                    // Fallback to search if category fails
                    quotes = await api.searchQuotes(moodId);
                }
            }

            const quotesList = Array.isArray(quotes) ? quotes : (quotes?.quotes || []);
            setMoodQuotes(quotesList);
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

    const handleSearch = async (queryText) => {
        const query = (queryText ?? searchQuery).trim();
        if (!query || isSearching) return;

        try {
            setSelectedMood('search');
            setIsSearching(true);
            setLastSearchQuery(query);
            const data = await api.searchQuotes(query);
            const results = Array.isArray(data) ? data : (data?.quotes || []);
            setMoodQuotes(results);
        } catch (error) {
            setMoodQuotes([]);
            console.log('Search failed:', error);
        } finally {
            setIsSearching(false);
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

    const handleUnlockTrending = async () => {
        if (isTrendingUnlocking) return;
        if (monetizationLoading) {
            Alert.alert('Please wait', 'Ads are still loading. Try again in a moment.');
            return;
        }
        setIsTrendingUnlocking(true);

        try {
            const reward = await showManagedRewarded({
                config: monetizationConfig,
                deviceId,
                placement: 'trendingRewarded',
            });

            if (reward.shown && reward.rewardEarned) {
                setTrendingUnlocked(true);
                return;
            }

            if (!reward.shown) {
                if (reward.reason === 'placement_disabled') {
                    Alert.alert('Temporarily Unavailable', 'Trending unlock ad is turned off right now.');
                    return;
                }
                const detail = __DEV__ && reward.errorMessage
                    ? `\n\nDebug: ${reward.errorMessage}`
                    : '';
                Alert.alert('Ad Unavailable', `Rewarded ad did not load. Please try again.${detail}`);
                return;
            }

            Alert.alert('Unlock Incomplete', 'Watch full ad to unlock more trending quotes.');
        } finally {
            setIsTrendingUnlocking(false);
        }
    };

    const renderResultsTitle = () => {
        if (selectedMood === 'search') return `Results for "${lastSearchQuery || searchQuery}"`;
        const patch = fabricPatches.find(p => p.id === selectedMood);
        if (patch) return `${patch.label} Quotes`;

        const collection = CURATED_COLLECTIONS.find(c => c.id === selectedMood);
        if (collection) return `${collection.title}`;

        return 'Selected Quotes';
    };

    const renderResultsSection = () => (
        <View style={styles.resultsSection}>
            <View style={styles.resultsHeaderRow}>
                <Text style={styles.sectionTitle}>{renderResultsTitle()}</Text>
                <View style={styles.resultsCountBadge}>
                    <Text style={styles.resultsCountText}>{moodQuotes.length}</Text>
                </View>
            </View>
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
    );

    const visibleTrendingQuotes = trendingUnlocked
        ? trendingQuotes
        : trendingQuotes.slice(0, 10);
    const canShowTrendingUnlock =
        !monetizationLoading
        && monetizationConfig?.globalEnabled !== false
        && monetizationConfig?.blockedForDevice !== true
        && !trendingUnlocked
        && monetizationConfig?.features?.trendingRewardUnlockEnabled !== false
        && monetizationConfig?.placements?.trendingRewarded?.enabled !== false;

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
                            onSubmitEditing={({ nativeEvent }) => handleSearch(nativeEvent.text)}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <Pressable
                                onPress={() => handleSearch()}
                                style={[styles.searchActionBtn, isSearching && styles.searchActionBtnDisabled]}
                                disabled={isSearching}
                            >
                                <ArrowRight size={20} color="#fff" />
                            </Pressable>
                        )}
                    </View>
                    {selectedMood === 'search' && (
                        <View style={styles.searchMetaRow}>
                            <Text style={styles.searchMetaText}>
                                {isSearching
                                    ? 'Searching...'
                                    : moodQuotes.length > 0
                                    ? `${moodQuotes.length} result${moodQuotes.length === 1 ? '' : 's'}`
                                    : 'No results'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Search results - shown near top/right */}
                {selectedMood === 'search' && (
                    isSearching ? (
                        <ActivityIndicator color={colors.accent.gold} style={styles.loader} />
                    ) : (
                        moodQuotes.length > 0 && renderResultsSection()
                    )
                )}

                {/* Fabric Patches Grid */}
                <View style={[styles.sectionHeader, { marginTop: 4 }]}>
                    <Text style={styles.sectionTitle}>Quote's Categories</Text>
                    {/* <Text style={styles.sectionSubtitle}>DAILY INSPIRATION</Text> */}
                </View>

                <View style={styles.patchesGrid}>
                    {fabricPatches.map((patch) => (
                        <FabricPatch
                            key={patch.id}
                            patch={patch}
                            isSelected={selectedMood === patch.id}
                            onPress={handleMoodSelect}
                        />
                    ))}
                </View>

                <ManagedBannerAd
                    config={monetizationConfig}
                    placement="discoverBanner"
                    deviceId={deviceId}
                    style={styles.bannerSlot}
                />

                {/* Mood Quotes (if mood selected) */}
                {selectedMood && selectedMood !== 'search' && moodQuotes.length > 0 && renderResultsSection()}

                {/* Hand-Stitched Collections */}
                {/* <Text style={[styles.sectionTitle, { marginTop: 4, marginBottom: 12, paddingHorizontal: 4 }]}>Hand-Stitched Collections</Text>
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
                </ScrollView> */}

                {/* Trending */}
                <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 12 }]}>🔥 Trending Now</Text>
                {canShowTrendingUnlock && (
                    <Pressable
                        style={[styles.unlockTrendingButton, isTrendingUnlocking && styles.unlockTrendingButtonDisabled]}
                        onPress={handleUnlockTrending}
                        disabled={isTrendingUnlocking}
                    >
                        <Text style={styles.unlockTrendingButtonText}>
                            {isTrendingUnlocking ? 'Loading ad...' : 'Watch ad to unlock more trending'}
                        </Text>
                    </Pressable>
                )}
                {isLoading ? (
                    <ActivityIndicator color={colors.accent.gold} style={styles.loader} />
                ) : (
                    <FlatList
                        horizontal
                        data={visibleTrendingQuotes}
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
    searchActionBtnDisabled: {
        opacity: 0.7,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text.primary,
        height: '100%',
    },
    searchMetaRow: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    searchMetaText: {
        ...textStyles.caption,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: 8,
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
        gap: 8,
    },
    bannerSlot: {
        marginTop: 12,
        marginBottom: 10,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.ui.border,
        backgroundColor: colors.background.secondary,
        borderRadius: 10,
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
        marginBottom: 8,
    },
    resultsHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    resultsCountBadge: {
        minWidth: 26,
        height: 26,
        borderRadius: 13,
        paddingHorizontal: 8,
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.ui.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    resultsCountText: {
        ...textStyles.caption,
        color: colors.text.primary,
        fontWeight: '700',
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
        gap: 8,
        paddingVertical: 2,
        marginBottom: 8,
    },
    quotePreview: {
        width: 160,
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: colors.background.secondary,
        borderWidth: 2,
        borderColor: colors.ui.border,
        borderStyle: 'dashed',
    },
    imagePreviewContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imagePreviewOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    imagePreviewText: {
        fontSize: 12,
        lineHeight: 18,
        color: '#fff',
        fontWeight: '500',
        marginBottom: 4,
    },
    imagePreviewAuthor: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    quoteGradient: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
    },
    quotePreviewText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#fff',
        fontWeight: '500',
    },
    quotePreviewAuthor: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 8,
        fontWeight: '600',
    },
    loader: {
        marginVertical: 24,
    },
    unlockTrendingButton: {
        alignSelf: 'flex-start',
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: colors.accent.gold,
    },
    unlockTrendingButtonDisabled: {
        opacity: 0.75,
    },
    unlockTrendingButtonText: {
        ...textStyles.caption,
        color: colors.accent.gold,
        fontWeight: '700',
    },
    bottomPadding: {
        height: 100,
    },
});

export default DiscoverScreen;
