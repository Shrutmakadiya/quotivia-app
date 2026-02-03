// Home Screen - Quote Cinematics Engine
// Full-screen quote cards with swipe gestures
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

import QuoteCard from '../components/QuoteCard';
import QuoteSnapshot from '../components/QuoteSnapshot';
import StreakBar from '../components/StreakBar';
import { BadgeUnlock } from '../components/BadgeDisplay';
import { useStreak } from '../hooks';
import api from '../services/api';
import { colors, textStyles } from '../theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Sample quotes for offline/initial state
const SAMPLE_QUOTES = [
    { _id: '1', text: "The only way to do great work is to love what you do.", author: "Steve Jobs", mood: "hope", particleTheme: "firefly" },
    { _id: '2', text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", mood: "hope", particleTheme: "firefly" },
    { _id: '3', text: "Peace comes from within. Do not seek it without.", author: "Buddha", mood: "calm", particleTheme: "fog" },
    { _id: '4', text: "The darker the night, the brighter the stars.", author: "Fyodor Dostoevsky", mood: "melancholy", particleTheme: "rain" },
    { _id: '5', text: "What you seek is seeking you.", author: "Rumi", mood: "wisdom", particleTheme: "firefly" },
];

const HomeScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const flatListRef = useRef(null);
    const snapshotRef = useRef(null);

    const [quotes, setQuotes] = useState(SAMPLE_QUOTES);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showAuthorModal, setShowAuthorModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [shareQuote, setShareQuote] = useState(null); // Quote being captured for share/save

    const {
        streak,
        badges,
        newBadge,
        recordQuoteView,
        clearNewBadge,
        DAILY_QUOTA
    } = useStreak();



    // Handle focus quote from navigation
    useEffect(() => {
        if (route.params?.focusQuote) {
            const focusedQuote = route.params.focusQuote;
            setQuotes(prev => {
                const filtered = prev.filter(q => q._id !== focusedQuote._id);
                return [focusedQuote, ...filtered];
            });
            // Reset to top immediately
            setCurrentIndex(0);
            if (flatListRef.current) {
                flatListRef.current.scrollToIndex({ index: 0, animated: false });
            }
        }
    }, [route.params?.focusQuote]);

    // Fetch quotes on mount
    useEffect(() => {
        fetchQuotes();
    }, []);



    // Handle new badge notification
    useEffect(() => {
        if (newBadge) {
            setShowBadgeModal(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, [newBadge]);

    const fetchQuotes = async () => {
        try {
            setIsLoading(true);
            const data = await api.getQuotes(1, 50);
            if (data?.quotes?.length > 0) {
                setQuotes(prev => {
                    // If we have a focused quote, we must preserve it at the top
                    if (route.params?.focusQuote) {
                        const focusQ = route.params.focusQuote;
                        const newQuotes = data.quotes.filter(q => q._id !== focusQ._id);
                        return [focusQ, ...newQuotes];
                    }
                    return data.quotes;
                });
            }
        } catch (error) {
            console.log('Using sample quotes:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuoteRead = useCallback((quote) => {
        recordQuoteView(quote._id);

        api.incrementViewCount(quote._id).catch(() => { });
    }, [recordQuoteView]);

    const handleSwipeUp = useCallback((quote) => {
        // Move to next quote
        if (currentIndex < quotes.length - 1) {
            const nextIndex = currentIndex + 1;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentIndex(nextIndex);
        } else {
            // Load more quotes or loop
            setCurrentIndex(0);
            flatListRef.current?.scrollToIndex({ index: 0, animated: true });
        }
    }, [currentIndex, quotes.length]);

    const handleSwipeDown = useCallback((quote) => {
        // Show author bio modal
        setSelectedQuote(quote);
        setShowAuthorModal(true);
    }, []);

    const handleSwipeLeft = useCallback(async (quote) => {
        // Share quote as image
        try {
            setShareQuote(quote);
            // Wait for snapshot to render
            await new Promise(resolve => setTimeout(resolve, 500));

            if (snapshotRef.current) {
                const uri = await captureRef(snapshotRef, {
                    format: 'png',
                    quality: 1,
                    result: 'tmpfile',
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, {
                        mimeType: 'image/png',
                        dialogTitle: 'Share Quote',
                    });
                } else {
                    // Fallback to text share
                    await Share.share({
                        message: `"${quote.text}" \n— ${quote.author}\n\nShared via Quotiva ✨`,
                    });
                }
            }
        } catch (error) {
            console.error('Share failed:', error);
            // Fallback to text share
            await Share.share({
                message: `"${quote.text}" \n— ${quote.author}\n\nShared via Quotiva ✨`,
            });
        } finally {
            setShareQuote(null);
        }
    }, []);

    const handleSwipeRight = useCallback(async (quote) => {
        // Save quote as image to gallery
        try {
            setShareQuote(quote);
            // Wait for snapshot to render
            await new Promise(resolve => setTimeout(resolve, 500));

            if (snapshotRef.current) {
                // Request permission
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission Required',
                        'Please allow access to save images to your gallery.',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                const uri = await captureRef(snapshotRef, {
                    format: 'png',
                    quality: 1,
                    result: 'tmpfile',
                });

                await MediaLibrary.saveToLibraryAsync(uri);

                Alert.alert(
                    'Saved! 🎉',
                    'Quote image saved to your photo library.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Save failed:', error);
            Alert.alert(
                'Save Failed',
                'Could not save the image. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setShareQuote(null);
        }
    }, []);

    const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index;
            if (newIndex !== currentIndex) {
                setCurrentIndex(newIndex);
            }
        }
    }, [currentIndex]);

    const renderQuote = useCallback(({ item, index }) => (
        <QuoteCard
            quote={item}
            index={index}
            onSwipeUp={handleSwipeUp}
            onSwipeDown={handleSwipeDown}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onQuoteRead={handleQuoteRead}
            showAnimation={index === currentIndex}
        />
    ), [currentIndex, handleSwipeUp, handleSwipeDown, handleSwipeLeft, handleSwipeRight, handleQuoteRead]);

    const getItemLayout = useCallback((data, index) => ({
        length: SCREEN_HEIGHT,
        offset: SCREEN_HEIGHT * index,
        index,
    }), []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Off-screen Quote Snapshot for image capture */}
            {shareQuote && (
                <View style={styles.snapshotContainer}>
                    <QuoteSnapshot
                        ref={snapshotRef}
                        quote={shareQuote}
                    />
                </View>
            )}
            {/* Quote Feed */}
            <FlatList
                ref={flatListRef}
                data={quotes}
                renderItem={renderQuote}
                keyExtractor={(item) => item._id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                getItemLayout={getItemLayout}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                decelerationRate="fast"
                snapToInterval={SCREEN_HEIGHT}
                snapToAlignment="start"
            />

            {/* Streak Bar Overlay */}
            <View style={[styles.streakOverlay, { top: insets.top + 10 }]}>
                <StreakBar
                    currentCount={streak.count}
                    totalStreak={streak.total}
                />
            </View>

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
        color: colors.background.primary,
        fontWeight: '700',
    },
});

export default HomeScreen;
