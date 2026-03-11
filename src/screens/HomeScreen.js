// Home Screen - Quote Cinematics Engine with Stitched Theme
// Full-screen quote cards with swipe gestures and category filters
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    FlatList,
    StyleSheet,
    Dimensions,
    StatusBar,
    Modal,
    Text,
    Pressable,
    Share,
    Alert,
    Platform,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

import QuoteCard from '../components/QuoteCard';
import QuoteSnapshot from '../components/QuoteSnapshot';
import StreakBar from '../components/StreakBar';
import ManagedBannerAd from '../components/ManagedBannerAd';
import { BadgeUnlock } from '../components/BadgeDisplay';
import { useStreak, useMonetization } from '../hooks';
import api from '../services/api';
import {
    preloadManagedRewarded,
    recordMonetizationAction,
    showManagedInterstitial,
    showManagedRewarded,
} from '../services/adManager';
import { colors, textStyles, getCategoryStyle } from '../theme';
import { orderQuotesForSession, orderQuotesForSessionNoImmediateRepeat } from '../utils/quoteOrder';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Category data with icons
const CATEGORIES = [
    { id: 'all', name: 'All', icon: '♾️' },
    { id: 'motivation', name: 'Motivation', icon: '💪' },
    { id: 'love', name: 'Love', icon: '❤️' },
    { id: 'success', name: 'Success', icon: '📈' },
    { id: 'life', name: 'Life', icon: '🧘' },
    { id: 'wisdom', name: 'Wisdom', icon: '📚' },
    { id: 'creativity', name: 'Creativity', icon: '🎨' },
];

// Category Chip Component
const CategoryChip = ({ category, isSelected, onPress }) => {
    const categoryStyle = getCategoryStyle(category.id);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.categoryChip,
                {
                    backgroundColor: isSelected ? categoryStyle.background : 'transparent',
                    borderColor: categoryStyle.icon,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                },
            ]}
            onPress={() => onPress(category.id)}
        >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
                styles.categoryName,
                { color: categoryStyle.icon }
            ]}>
                {category.name}
            </Text>
        </Pressable>
    );
};

const ensureFileUri = (value) => {
    if (!value || typeof value !== 'string') {
        throw new Error('Invalid file URI');
    }
    if (value.startsWith('file://') || value.startsWith('content://')) {
        return value;
    }
    if (value.startsWith('/')) {
        return `file://${value}`;
    }
    return value;
};

const stageShareFileInCache = async (sourceUri) => {
    const normalizedSourceUri = ensureFileUri(sourceUri);
    if (!FileSystem.cacheDirectory) {
        return normalizedSourceUri;
    }

    const destinationUri = `${FileSystem.cacheDirectory}quoteshub-share-${Date.now()}.png`;
    await FileSystem.copyAsync({
        from: normalizedSourceUri,
        to: destinationUri,
    });
    return destinationUri;
};

const HomeScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const flatListRef = useRef(null);
    const snapshotRef = useRef(null);
    const snapshotReadyRef = useRef(false);
    const lastTrackedQuoteKeyRef = useRef(null);

    const initialQuotes = route?.params?.initialQuotes;
    const [quotes, setQuotes] = useState(initialQuotes && initialQuotes.length > 0 ? initialQuotes : []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(!initialQuotes || initialQuotes.length === 0);
    const [showAuthorModal, setShowAuthorModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [shareQuote, setShareQuote] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [likedQuoteIds, setLikedQuoteIds] = useState([]);
    const [savedQuoteIds, setSavedQuoteIds] = useState([]);
    const [loadError, setLoadError] = useState(null);
    const [snapshotSize, setSnapshotSize] = useState(SCREEN_WIDTH);
    const [isAdFlowBusy, setIsAdFlowBusy] = useState(false);

    const {
        streak,
        badges,
        newBadge,
        recordQuoteView,
        clearNewBadge,
        isLoading: streakLoading,
        deviceId,
        canReviveStreak,
        reviveStreak,
    } = useStreak();
    const {
        config: monetizationConfig,
        refreshConfig,
        isLoading: monetizationLoading,
    } = useMonetization(deviceId);

    useFocusEffect(
        useCallback(() => {
            refreshConfig(false);
        }, [refreshConfig]),
    );

    useEffect(() => {
        if (monetizationLoading) return;
        if (!monetizationConfig?.globalEnabled || monetizationConfig?.blockedForDevice) return;

        preloadManagedRewarded({
            config: monetizationConfig,
            deviceId,
            placement: 'hdDownloadRewarded',
        });

        if (monetizationConfig?.features?.streakReviveEnabled !== false) {
            preloadManagedRewarded({
                config: monetizationConfig,
                deviceId,
                placement: 'streakReviveRewarded',
            });
        }
    }, [deviceId, monetizationConfig, monetizationLoading]);

    // Fetch user's liked and saved quotes on mount
    useEffect(() => {
        if (deviceId) {
            api.getLikedAndSavedQuotes(deviceId)
                .then(data => {
                    setLikedQuoteIds(data.likedQuoteIds || []);
                    setSavedQuoteIds(data.savedQuoteIds || []);
                })
                .catch(console.error);
        }
    }, [deviceId]);

    // Handle category selection
    const handleCategoryPress = useCallback((categoryId) => {
        // If 'all' is selected or same category toggled, clear selection
        const newCategory = (categoryId === 'all' || selectedCategory === categoryId) ? null : categoryId;
        setSelectedCategory(newCategory);
        fetchQuotes(newCategory);
    }, [selectedCategory]);

    // Handle focus quote from navigation
    useEffect(() => {
        if (route.params?.focusQuote) {
            const focusedQuote = route.params.focusQuote;
            setQuotes(prev => {
                const filtered = prev.filter(q => q._id !== focusedQuote._id);
                return [focusedQuote, ...filtered];
            });
            setCurrentIndex(0);
            lastTrackedQuoteKeyRef.current = null;
            if (flatListRef.current) {
                flatListRef.current.scrollToIndex({ index: 0, animated: false });
            }
        }
    }, [route.params?.focusQuote]);

    // Fetch quotes on mount (only if no pre-loaded quotes)
    useEffect(() => {
        if (!initialQuotes || initialQuotes.length === 0) {
            fetchQuotes();
        }
    }, []);

    // Handle new badge notification
    useEffect(() => {
        if (newBadge) {
            setShowBadgeModal(true);
        }
    }, [newBadge]);

    const fetchQuotes = async (category = selectedCategory) => {
        try {
            setIsLoading(true);
            setLoadError(null);
            let data;

            if (category) {
                // Use search for categories to find relevant quotes
                data = await api.searchQuotes(category);
            } else {
                data = await api.getQuotes(1, 50);
            }

            // Handle potential differences in response structure (array vs object with quotes key)
            const quotesList = Array.isArray(data) ? data : (data?.quotes || []);
            const orderedQuotes = category
                ? orderQuotesForSession(quotesList)
                : await orderQuotesForSessionNoImmediateRepeat(quotesList);
            let nextQuotes = orderedQuotes;

            if (route.params?.focusQuote && orderedQuotes.length > 0) {
                const focusQ = route.params.focusQuote;
                const filteredQuotes = orderedQuotes.filter(q => q._id !== focusQ._id);
                nextQuotes = [focusQ, ...filteredQuotes];
            }

            // Always update quotes, even if empty, to reflect the filter result
            lastTrackedQuoteKeyRef.current = null;
            setQuotes(nextQuotes);
            setCurrentIndex(0);
            if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: false });
            }

        } catch (error) {
            console.log('Error fetching quotes:', error.message);
            setLoadError('Could not load fresh quotes right now.');
            setQuotes(prev => (prev.length > 0 ? prev : []));
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuoteRead = useCallback((quote) => {
        if (!quote) return;
        const quoteId = quote._id || quote.id;
        recordQuoteView(quoteId);
        if (quoteId) {
            api.incrementViewCount(quoteId).catch(() => { });
        }
    }, [recordQuoteView]);

    const waitForSnapshotToRender = useCallback(async () => {
        const timeoutMs = 3000;
        const intervalMs = 100;
        let elapsed = 0;

        while (!snapshotReadyRef.current && elapsed < timeoutMs) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
            elapsed += intervalMs;
        }

        // Give RN one extra frame before capture.
        await new Promise((resolve) => setTimeout(resolve, 80));
    }, []);

    const captureQuoteImage = useCallback(async (quote, options = {}) => {
        const {
            size = SCREEN_WIDTH,
            quality = 1,
            format = 'png',
        } = options;

        snapshotReadyRef.current = false;
        setSnapshotSize(size);
        setShareQuote(quote);
        await waitForSnapshotToRender();

        if (!snapshotRef.current) {
            throw new Error('Snapshot ref unavailable');
        }

        return captureRef(snapshotRef.current, {
            format,
            quality,
            result: 'tmpfile',
        });
    }, [waitForSnapshotToRender]);

    const handleSwipeLeft = useCallback(async (quote) => {
        try {
            const rawUri = await captureQuoteImage(quote, {
                size: SCREEN_WIDTH,
                format: 'png',
                quality: 1,
            });
            const uri = await stageShareFileInCache(rawUri);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share Quote',
                });
            } else {
                await Share.share({
                    message: `"${quote.text}" \n— ${quote.author}\n\nShared via QuotesHub ✨`,
                });
            }

            recordMonetizationAction('share');
            showManagedInterstitial({
                config: monetizationConfig,
                deviceId,
                placement: 'homeInterstitial',
                actionType: 'share',
            });
        } catch (error) {
            console.error('Share failed:', error);
            try {
                const rawUri = await captureQuoteImage(quote, {
                    size: SCREEN_WIDTH,
                    format: 'png',
                    quality: 1,
                });
                const uri = await stageShareFileInCache(rawUri);
                await Share.share({
                    title: 'Share Quote',
                    url: uri,
                    message: `"${quote.text}" \n— ${quote.author}\n\nShared via QuotesHub ✨`,
                });
            } catch (fallbackError) {
                await Share.share({
                    message: `"${quote.text}" \n— ${quote.author}\n\nShared via QuotesHub ✨`,
                });
            }
        } finally {
            snapshotReadyRef.current = false;
            setShareQuote(null);
        }
    }, [captureQuoteImage, deviceId, monetizationConfig]);

    const downloadQuoteToLibrary = useCallback(async (quote, options = {}) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please allow access to save images to your gallery.',
                    [{ text: 'OK' }]
                );
                return false;
            }

            const rawUri = await captureQuoteImage(quote, options);
            const uri = ensureFileUri(rawUri);
            await MediaLibrary.saveToLibraryAsync(uri);
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            return false;
        } finally {
            snapshotReadyRef.current = false;
            setShareQuote(null);
        }
    }, [captureQuoteImage]);

    const handleNonHdDownload = useCallback(async (quote) => {
        const success = await downloadQuoteToLibrary(quote, {
            size: SCREEN_WIDTH,
            format: 'jpg',
            quality: 0.78,
        });

        if (!success) {
            Alert.alert('Save Failed', 'Could not save the image. Please try again.');
            return;
        }

        recordMonetizationAction('download');
        showManagedInterstitial({
            config: monetizationConfig,
            deviceId,
            placement: 'homeInterstitial',
            actionType: 'download',
        });

        Alert.alert('Saved', 'Standard-quality quote image saved to your gallery.');
    }, [deviceId, downloadQuoteToLibrary, monetizationConfig]);

    const handleHdDownload = useCallback(async (quote) => {
        if (isAdFlowBusy) return;
        if (monetizationLoading) {
            Alert.alert('Please wait', 'Ads are still loading. Try again in a moment.');
            return;
        }
        setIsAdFlowBusy(true);
        try {
            const rewardResult = await showManagedRewarded({
                config: monetizationConfig,
                deviceId,
                placement: 'hdDownloadRewarded',
            });

            if (!rewardResult.shown) {
                if (rewardResult.reason === 'placement_disabled') {
                    Alert.alert('Temporarily Unavailable', 'HD rewarded ad is turned off right now.');
                    return;
                }
                const detail = __DEV__ && rewardResult.errorMessage
                    ? `\n\nDebug: ${rewardResult.errorMessage}`
                    : '';
                Alert.alert('Ad Unavailable', `Rewarded ad did not load. Please try again in a moment.${detail}`);
                return;
            }

            if (!rewardResult.rewardEarned) {
                Alert.alert('Ad Not Completed', 'Watch full ad to unlock HD download.');
                return;
            }

            const success = await downloadQuoteToLibrary(quote, {
                size: 2048,
                format: 'png',
                quality: 1,
            });

            if (!success) {
                Alert.alert('Save Failed', 'Could not save HD image. Please try again.');
                return;
            }

            Alert.alert('HD Unlocked', 'HD quote image saved to your gallery.');
        } finally {
            setIsAdFlowBusy(false);
        }
    }, [deviceId, downloadQuoteToLibrary, isAdFlowBusy, monetizationConfig, monetizationLoading]);

    const handleSwipeRight = useCallback((quote) => {
        const allowNonHd = monetizationConfig?.features?.nonHdDownloadEnabled !== false;
        const allowHd = (
            !monetizationLoading
            && monetizationConfig?.globalEnabled !== false
            && monetizationConfig?.blockedForDevice !== true
            && monetizationConfig?.features?.hdDownloadEnabled !== false
            && monetizationConfig?.placements?.hdDownloadRewarded?.enabled !== false
        );

        if (!allowNonHd && !allowHd) {
            Alert.alert('Download Disabled', 'Downloads are disabled right now.');
            return;
        }

        const buttons = [];
        if (allowNonHd) {
            buttons.push({
                text: 'Save Standard',
                onPress: () => handleNonHdDownload(quote),
            });
        }
        if (allowHd) {
            buttons.push({
                text: 'Save HD (Watch ad)',
                onPress: () => handleHdDownload(quote),
            });
        }

        buttons.push({ text: 'Cancel', style: 'cancel' });
        Alert.alert('Download Image', 'Choose quality option', buttons);
    }, [
        handleHdDownload,
        handleNonHdDownload,
        monetizationConfig?.blockedForDevice,
        monetizationConfig?.features?.hdDownloadEnabled,
        monetizationConfig?.features?.nonHdDownloadEnabled,
        monetizationConfig?.globalEnabled,
        monetizationConfig?.placements?.hdDownloadRewarded?.enabled,
        monetizationLoading,
    ]);

    const handleRevivePress = useCallback(async () => {
        if (!canReviveStreak || isAdFlowBusy) return;
        if (monetizationLoading) {
            Alert.alert('Please wait', 'Ads are still loading. Try again in a moment.');
            return;
        }
        setIsAdFlowBusy(true);

        try {
            const rewardResult = await showManagedRewarded({
                config: monetizationConfig,
                deviceId,
                placement: 'streakReviveRewarded',
            });

            if (!rewardResult.shown) {
                if (rewardResult.reason === 'placement_disabled') {
                    Alert.alert('Temporarily Unavailable', 'Streak revive ad is turned off right now.');
                    return;
                }
                const detail = __DEV__ && rewardResult.errorMessage
                    ? `\n\nDebug: ${rewardResult.errorMessage}`
                    : '';
                Alert.alert('Ad Unavailable', `Rewarded ad did not load. Please try again.${detail}`);
                return;
            }

            if (!rewardResult.rewardEarned) {
                Alert.alert('Revive Not Completed', 'Watch the full ad to revive streak.');
                return;
            }

            const revived = await reviveStreak();
            if (revived) {
                Alert.alert('Streak Revived', 'Your streak has been restored.');
            }
        } finally {
            setIsAdFlowBusy(false);
        }
    }, [canReviveStreak, deviceId, isAdFlowBusy, monetizationConfig, monetizationLoading, reviveStreak]);

    // Handle like button press
    const handleLike = useCallback(async (quote, options = {}) => {
        if (!deviceId || !quote._id) return;
        const shouldLike = typeof options.nextLiked === 'boolean'
            ? options.nextLiked
            : !likedQuoteIds.includes(quote._id);

        const delta = shouldLike ? 1 : -1;

        // Optimistic UI update
        setLikedQuoteIds(prev => {
            if (shouldLike) {
                return prev.includes(quote._id) ? prev : [...prev, quote._id];
            }
            return prev.filter(id => id !== quote._id);
        });

        setQuotes(prev => prev.map(item => {
            if (item._id !== quote._id) return item;
            const baseCount = typeof item.likesCount === 'number' ? item.likesCount : 0;
            return { ...item, likesCount: Math.max(0, baseCount + delta) };
        }));

        try {
            const response = shouldLike
                ? await api.likeQuote(deviceId, quote._id)
                : await api.unlikeQuote(deviceId, quote._id);

            if (typeof response?.likesCount === 'number') {
                setQuotes(prev => prev.map(item => (
                    item._id === quote._id
                        ? { ...item, likesCount: response.likesCount }
                        : item
                )));
            }
        } catch (error) {
            console.error('Like failed:', error);
            // Revert optimistic update on failure
            setLikedQuoteIds(prev => {
                if (shouldLike) {
                    return prev.filter(id => id !== quote._id);
                }
                return prev.includes(quote._id) ? prev : [...prev, quote._id];
            });

            setQuotes(prev => prev.map(item => {
                if (item._id !== quote._id) return item;
                const baseCount = typeof item.likesCount === 'number' ? item.likesCount : 0;
                return { ...item, likesCount: Math.max(0, baseCount - delta) };
            }));
        }
    }, [deviceId, likedQuoteIds]);

    // Handle save/bookmark button press
    const handleSave = useCallback(async (quote) => {
        if (!deviceId || !quote._id) return;
        try {
            await api.saveQuote(deviceId, quote._id);

            // Update local state
            setSavedQuoteIds(prev => {
                if (prev.includes(quote._id)) {
                    return prev.filter(id => id !== quote._id);
                } else {
                    return [...prev, quote._id];
                }
            });
        } catch (error) {
            console.error('Save failed:', error);
        }
    }, [deviceId]);

    const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
        const firstVisible = viewableItems.find((item) => item.isViewable && item.item);
        if (!firstVisible) return;

        const newIndex = typeof firstVisible.index === 'number' ? firstVisible.index : 0;
        setCurrentIndex((prev) => (prev === newIndex ? prev : newIndex));

        const quote = firstVisible.item;
        const quoteKey =
            quote?._id ||
            quote?.id ||
            quote?.imageUrl ||
            `${quote?.author || ''}:${quote?.text || ''}`;

        if (quoteKey && quoteKey !== lastTrackedQuoteKeyRef.current) {
            lastTrackedQuoteKeyRef.current = quoteKey;
            handleQuoteRead(quote);
        }
    }, [handleQuoteRead]);

    const renderQuote = useCallback(({ item, index }) => (
        <QuoteCard
            quote={item}
            index={index}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onLike={handleLike}
            onSave={handleSave}
            showAnimation={index === currentIndex}
            initialLiked={likedQuoteIds.includes(item._id)}
            initialSaved={savedQuoteIds.includes(item._id)}
        />
    ), [currentIndex, handleSwipeLeft, handleSwipeRight, handleLike, handleSave, likedQuoteIds, savedQuoteIds]);



    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text style={styles.brandText}>QuotesHub</Text>
                <View style={styles.headerRight}>
                    <StreakBar
                        currentCount={streak.count}
                        totalStreak={streak.total}
                    />
                </View>
            </View>

            {/* Category Filters */}
            <View style={styles.categoryContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {CATEGORIES.map(category => (
                        <CategoryChip
                            key={category.id}
                            category={category}
                            isSelected={selectedCategory === category.id || (category.id === 'all' && selectedCategory === null)}
                            onPress={handleCategoryPress}
                        />
                    ))}
                </ScrollView>
            </View>

            <ManagedBannerAd
                config={monetizationConfig}
                placement="homeBanner"
                deviceId={deviceId}
                style={styles.bannerSlot}
            />

            {canReviveStreak && monetizationConfig?.features?.streakReviveEnabled !== false && (
                <View style={styles.reviveContainer}>
                    <View style={styles.reviveTextWrap}>
                        <Text style={styles.reviveTitle}>Streak Broken</Text>
                        <Text style={styles.reviveSubtitle}>Watch one ad to restore your streak.</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.reviveButton, isAdFlowBusy && styles.reviveButtonDisabled]}
                        onPress={handleRevivePress}
                        disabled={isAdFlowBusy}
                    >
                        <Text style={styles.reviveButtonText}>Revive</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Off-screen Quote Snapshot for image capture */}
            {shareQuote && (
                <View style={styles.snapshotContainer}>
                    <QuoteSnapshot
                        ref={snapshotRef}
                        quote={shareQuote}
                        size={snapshotSize}
                        onReady={() => {
                            snapshotReadyRef.current = true;
                        }}
                    />
                </View>
            )}

            {/* Quote Feed */}
            {isLoading && quotes.length > 0 && (
                <View style={styles.inlineLoader}>
                    <ActivityIndicator color={colors.accent.gold} size="small" />
                </View>
            )}

            <FlatList
                ref={flatListRef}
                data={quotes} // Use quotes directly, not filteredQuotes
                renderItem={renderQuote}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                refreshing={isLoading && quotes.length > 0}
                onRefresh={() => fetchQuotes(selectedCategory)}
                ListEmptyComponent={(
                    <View style={styles.emptyState}>
                        {isLoading ? (
                            <>
                                <ActivityIndicator color={colors.accent.gold} size="large" />
                                <Text style={styles.emptyTitle}>Loading quotes...</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.emptyTitle}>
                                    {loadError || 'No quotes found for this category yet.'}
                                </Text>
                                <Pressable
                                    style={styles.retryButton}
                                    onPress={() => fetchQuotes(selectedCategory)}
                                >
                                    <Text style={styles.retryButtonText}>Try Again</Text>
                                </Pressable>
                            </>
                        )}
                    </View>
                )}
            />



            {/* Author Modal */}
            <Modal
                visible={showAuthorModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAuthorModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowAuthorModal(false)}
                >
                    <View style={styles.authorModal}>
                        <Text style={styles.authorName}>{selectedQuote?.author}</Text>
                        <Text style={styles.authorBio}>
                            A source of wisdom and inspiration. Explore more quotes from this author in the Discover tab.
                        </Text>
                        <Pressable
                            style={styles.closeButton}
                            onPress={() => setShowAuthorModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>

            {/* Badge Unlock Modal */}
            <Modal
                visible={showBadgeModal}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setShowBadgeModal(false);
                    clearNewBadge();
                }}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => {
                        setShowBadgeModal(false);
                        clearNewBadge();
                    }}
                >
                    <View style={styles.badgeModal}>
                        {newBadge && <BadgeUnlock badge={newBadge} />}
                        <Pressable
                            style={styles.celebrateButton}
                            onPress={() => {
                                setShowBadgeModal(false);
                                clearNewBadge();
                            }}
                        >
                            <Text style={styles.celebrateButtonText}>🎉 Celebrate!</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
        backgroundColor: colors.ui.overlayLight,
        zIndex: 50,
    },
    brandText: {
        fontFamily: Platform.select({ ios: 'Noteworthy-Bold', android: 'serif' }),
        fontSize: 24,
        fontWeight: '700',
        color: colors.accent.gold,
        letterSpacing: 0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    notificationBtn: {
        position: 'relative',
    },
    notificationIcon: {
        fontSize: 24,
    },
    notificationBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.accent.gold,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationCount: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.text.light,
    },
    categoryContainer: {
        paddingVertical: 12,
        backgroundColor: colors.background.primary,
    },
    bannerSlot: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.ui.border,
        backgroundColor: colors.background.secondary,
        borderRadius: 10,
    },
    categoryScroll: {
        paddingHorizontal: 16,
        gap: 10,
    },
    reviveContainer: {
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.ui.border,
        backgroundColor: colors.background.secondary,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    reviveTextWrap: {
        flex: 1,
    },
    reviveTitle: {
        ...textStyles.body,
        color: colors.text.primary,
        fontWeight: '700',
    },
    reviveSubtitle: {
        ...textStyles.caption,
        color: colors.text.secondary,
        marginTop: 2,
    },
    reviveButton: {
        backgroundColor: colors.accent.gold,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    reviveButtonDisabled: {
        opacity: 0.7,
    },
    reviveButtonText: {
        color: colors.text.light,
        fontWeight: '700',
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 6,
    },
    categoryIcon: {
        fontSize: 14,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '700',
    },
    streakOverlay: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 100,
    },
    snapshotContainer: {
        position: 'absolute',
        left: -9999,
        top: 0,
        zIndex: -1,
    },
    inlineLoader: {
        position: 'absolute',
        top: 6,
        right: 16,
        zIndex: 100,
        backgroundColor: colors.ui.overlayLight,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    emptyState: {
        marginTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 12,
    },
    emptyTitle: {
        ...textStyles.body,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 6,
        backgroundColor: colors.accent.gold,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    retryButtonText: {
        ...textStyles.body,
        color: colors.text.light,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.ui.overlay,
        justifyContent: 'flex-end',
    },
    authorModal: {
        backgroundColor: colors.background.secondary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    authorName: {
        ...textStyles.heading,
        color: colors.text.primary,
        marginBottom: 12,
    },
    authorBio: {
        ...textStyles.body,
        color: colors.text.secondary,
        marginBottom: 24,
        lineHeight: 22,
    },
    closeButton: {
        backgroundColor: colors.background.tertiary,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        ...textStyles.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
    badgeModal: {
        backgroundColor: colors.background.secondary,
        marginHorizontal: 24,
        marginVertical: 'auto',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    celebrateButton: {
        backgroundColor: colors.accent.gold,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 16,
    },
    celebrateButtonText: {
        ...textStyles.body,
        color: colors.text.light,
        fontWeight: '700',
    },
});

export default HomeScreen;
