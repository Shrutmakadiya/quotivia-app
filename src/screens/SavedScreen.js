// Saved Screen - Display user's saved quotes
// Shows saved quotes in a grid with unsave functionality
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import api from '../services/api';
import { colors, textStyles } from '../theme';
import { useStreak } from '../hooks';
import { getQuoteImageSource } from '../assets/quotes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function SavedScreen({ navigation }) {
    const [savedQuotes, setSavedQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { deviceId } = useStreak();

    // Fetch saved quotes
    const fetchSavedQuotes = useCallback(async () => {
        if (!deviceId) return;

        try {
            setLoading(true);
            const quotes = await api.getSavedQuotes(deviceId);
            setSavedQuotes(quotes || []);
        } catch (error) {
            console.log('Using empty saved quotes - API not available');
            setSavedQuotes([]);
        } finally {
            setLoading(false);
        }
    }, [deviceId]);

    useEffect(() => {
        if (deviceId) {
            fetchSavedQuotes();
        }
    }, [deviceId, fetchSavedQuotes]);

    // Refresh when screen is focused
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (deviceId) {
                fetchSavedQuotes();
            }
        });
        return unsubscribe;
    }, [navigation, deviceId, fetchSavedQuotes]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSavedQuotes();
        setRefreshing(false);
    };

    const handleUnsave = async (quoteId) => {
        try {
            await api.unsaveQuote(deviceId, quoteId);
            setSavedQuotes(prev => prev.filter(q => q._id !== quoteId));
        } catch (error) {
            console.error('Failed to unsave quote:', error);
        }
    };

    const renderQuoteCard = ({ item }) => {
        const imageSource = getQuoteImageSource(item.imageUrl);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Home', { selectedQuote: item })}
            >
                <Image
                    source={imageSource}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
                <View style={styles.cardOverlay}>
                    <Text style={styles.cardAuthor} numberOfLines={1}>
                        — {item.author}
                    </Text>
                    <TouchableOpacity
                        style={styles.unsaveButton}
                        onPress={() => handleUnsave(item._id)}
                    >
                        <Ionicons name="bookmark" size={20} color={colors.accent.gold} />
                    </TouchableOpacity>
                </View>
                {item.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={80} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Saved Quotes</Text>
            <Text style={styles.emptySubtitle}>
                Quotes you save will appear here.{'\n'}
                Tap the bookmark icon on any quote to save it.
            </Text>
            <TouchableOpacity
                style={styles.discoverButton}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.discoverButtonText}>Discover Quotes</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && savedQuotes.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Saved</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.accent.gold} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Saved</Text>
                <Text style={styles.headerCount}>
                    {savedQuotes.length} {savedQuotes.length === 1 ? 'quote' : 'quotes'}
                </Text>
            </View>

            <FlatList
                data={savedQuotes}
                keyExtractor={(item) => item._id}
                renderItem={renderQuoteCard}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={[
                    styles.listContent,
                    savedQuotes.length === 0 && styles.emptyList
                ]}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent.gold}
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.ui.border,
    },
    headerTitle: {
        ...textStyles.title,
        fontSize: 28,
    },
    headerCount: {
        ...textStyles.bodySmall,
        color: colors.text.tertiary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    emptyList: {
        flex: 1,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.4,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.background.secondary,
        borderWidth: 2,
        borderColor: colors.ui.border,
        borderStyle: 'dashed',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    cardAuthor: {
        flex: 1,
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    unsaveButton: {
        padding: 4,
    },
    categoryBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: colors.accent.gold,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        ...textStyles.title,
        fontSize: 24,
        marginTop: 20,
        marginBottom: 10,
    },
    emptySubtitle: {
        ...textStyles.body,
        color: colors.text.tertiary,
        textAlign: 'center',
        lineHeight: 22,
    },
    discoverButton: {
        marginTop: 24,
        backgroundColor: colors.accent.gold,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    discoverButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});
