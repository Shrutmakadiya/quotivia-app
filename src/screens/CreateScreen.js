// Create Screen - Quote Studio with Image Upload
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    Pressable,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, textStyles, spacing, borderRadius, getMoodGradient } from '../theme';
import { useStreak } from '../hooks';
import api from '../services/api';

const CATEGORIES = [
    { id: 'motivation', name: 'Motivation', icon: '💪' },
    { id: 'love', name: 'Love', icon: '❤️' },
    { id: 'wisdom', name: 'Wisdom', icon: '📚' },
    { id: 'success', name: 'Success', icon: '📈' },
    { id: 'peace', name: 'Peace', icon: '🧘' },
    { id: 'creativity', name: 'Creativity', icon: '🎨' },
];

const MOODS = [
    { id: 'hope', name: 'Hope', color: '#FFD700' },
    { id: 'calm', name: 'Calm', color: '#87CEEB' },
    { id: 'energy', name: 'Energy', color: '#FF6B6B' },
    { id: 'wisdom', name: 'Wisdom', color: '#9B59B6' },
    { id: 'love', name: 'Love', color: '#E91E63' },
];

const CreateScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { deviceId } = useStreak();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [authorName, setAuthorName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
    const [selectedMood, setSelectedMood] = useState(MOODS[0]);

    // Pick image from gallery
    const pickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    // Take photo with camera
    const takePhoto = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleCategorySelect = (category) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCategory(category);
    };

    const handleMoodSelect = (mood) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedMood(mood);
    };

    const handlePublish = async () => {
        if (!selectedImage) {
            Alert.alert('Oops!', 'Please select an image for your quote.');
            return;
        }

        if (!authorName.trim()) {
            Alert.alert('Oops!', 'Please enter the author name.');
            return;
        }

        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            await api.uploadQuoteWithImage(
                selectedImage,
                authorName.trim(),
                selectedMood.id,
                selectedCategory.id,
                deviceId
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Quote Published! ✨',
                'Your quote has been published successfully.',
                [
                    { text: 'View Profile', onPress: () => navigation.navigate('Profile') },
                    {
                        text: 'Create Another', style: 'cancel', onPress: () => {
                            setSelectedImage(null);
                            setAuthorName('');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to publish quote. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <Text style={styles.title}>Create</Text>
                <Text style={styles.subtitle}>Upload your quote image</Text>

                {/* Image Picker */}
                <View style={styles.imageSection}>
                    {selectedImage ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                            <Pressable
                                style={styles.removeImageBtn}
                                onPress={() => setSelectedImage(null)}
                            >
                                <Ionicons name="close-circle" size={28} color="#ff3b5c" />
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="image-outline" size={48} color={colors.text.tertiary} />
                            <Text style={styles.placeholderText}>Select your quote image</Text>

                            <View style={styles.imageButtons}>
                                <Pressable style={styles.imageBtn} onPress={pickImage}>
                                    <Ionicons name="images-outline" size={24} color={colors.text.primary} />
                                    <Text style={styles.imageBtnText}>Gallery</Text>
                                </Pressable>
                                <Pressable style={styles.imageBtn} onPress={takePhoto}>
                                    <Ionicons name="camera-outline" size={24} color={colors.text.primary} />
                                    <Text style={styles.imageBtnText}>Camera</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
                </View>

                {/* Author Input */}
                <Text style={styles.sectionTitle}>Author Name</Text>
                <TextInput
                    style={styles.authorInput}
                    placeholder="Who said this quote?"
                    placeholderTextColor={colors.text.tertiary}
                    value={authorName}
                    onChangeText={setAuthorName}
                    maxLength={50}
                />

                {/* Category Selector */}
                <Text style={styles.sectionTitle}>Category</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryList}
                >
                    {CATEGORIES.map((category) => (
                        <Pressable
                            key={category.id}
                            style={[
                                styles.categoryCard,
                                selectedCategory.id === category.id && styles.categorySelected,
                            ]}
                            onPress={() => handleCategorySelect(category)}
                        >
                            <Text style={styles.categoryIcon}>{category.icon}</Text>
                            <Text style={[
                                styles.categoryName,
                                selectedCategory.id === category.id && styles.categoryNameSelected,
                            ]}>{category.name}</Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Mood Selector */}
                <Text style={styles.sectionTitle}>Mood</Text>
                <View style={styles.moodList}>
                    {MOODS.map((mood) => (
                        <Pressable
                            key={mood.id}
                            style={[
                                styles.moodCard,
                                { borderColor: mood.color },
                                selectedMood.id === mood.id && { backgroundColor: mood.color + '30' },
                            ]}
                            onPress={() => handleMoodSelect(mood)}
                        >
                            <View style={[styles.moodDot, { backgroundColor: mood.color }]} />
                            <Text style={styles.moodName}>{mood.name}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Publish Button */}
                <Pressable
                    style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]}
                    onPress={handlePublish}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.publishButtonText}>Publish Quote ✨</Text>
                    )}
                </Pressable>

                <View style={{ height: 100 }} />
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
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    title: {
        ...textStyles.h1,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...textStyles.body,
        color: colors.text.secondary,
        marginBottom: spacing.xl,
    },
    imageSection: {
        marginBottom: spacing.xl,
    },
    imagePlaceholder: {
        height: 300,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colors.ui.border,
        backgroundColor: colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        ...textStyles.body,
        color: colors.text.tertiary,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    imageButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    imageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.md,
    },
    imageBtnText: {
        ...textStyles.body,
        color: colors.text.primary,
        fontWeight: '600',
    },
    imagePreviewContainer: {
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 350,
        borderRadius: borderRadius.lg,
    },
    removeImageBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 14,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: colors.text.primary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    authorInput: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text.primary,
        borderWidth: 1,
        borderColor: colors.ui.border,
    },
    categoryList: {
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.full,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: spacing.xs,
    },
    categorySelected: {
        borderColor: colors.accent.gold,
        backgroundColor: colors.accent.gold + '20',
    },
    categoryIcon: {
        fontSize: 16,
    },
    categoryName: {
        ...textStyles.caption,
        color: colors.text.secondary,
        fontWeight: '600',
    },
    categoryNameSelected: {
        color: colors.text.primary,
    },
    moodList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    moodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        gap: spacing.xs,
    },
    moodDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    moodName: {
        ...textStyles.caption,
        color: colors.text.primary,
        fontWeight: '600',
    },
    publishButton: {
        backgroundColor: colors.accent.gold,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    publishButtonDisabled: {
        opacity: 0.6,
    },
    publishButtonText: {
        ...textStyles.body,
        color: '#000',
        fontWeight: '700',
    },
});

export default CreateScreen;
