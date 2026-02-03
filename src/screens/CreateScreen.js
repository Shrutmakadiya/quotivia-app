// Create Screen - Quote Studio
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    Pressable,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, textStyles, spacing, borderRadius, getMoodGradient } from '../theme';
import { useStreak } from '../hooks';
import api from '../services/api';

const TEMPLATES = [
    { id: 'hope', name: 'Sunrise', mood: 'hope' },
    { id: 'calm', name: 'Serenity', mood: 'calm' },
    { id: 'energy', name: 'Electric', mood: 'energy' },
    { id: 'wisdom', name: 'Ancient', mood: 'wisdom' },
    { id: 'love', name: 'Romance', mood: 'love' },
    { id: 'melancholy', name: 'Midnight', mood: 'melancholy' },
];

const FONTS = [
    { id: 'serif', name: 'Classic', family: 'Georgia' },
    { id: 'sans', name: 'Modern', family: 'System' },
    { id: 'mono', name: 'Minimal', family: 'Courier' },
];

const CreateScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { deviceId } = useStreak();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quoteText, setQuoteText] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
    const [selectedFont, setSelectedFont] = useState(FONTS[0]);

    const handleTemplateSelect = (template) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedTemplate(template);
    };

    const handleFontSelect = (font) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedFont(font);
    };

    const handleExport = async () => {
        if (!quoteText.trim()) {
            Alert.alert('Oops!', 'Please enter your quote first.');
            return;
        }

        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            await api.createQuote({
                text: quoteText,
                author: authorName || 'Anonymous',
                mood: selectedTemplate.mood,
                deviceHash: deviceId
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Quote Created! ✨',
                'Your quote has been published and saved to your profile.',
                [
                    { text: 'View Profile', onPress: () => navigation.navigate('Profile') },
                    {
                        text: 'Create Another', style: 'cancel', onPress: () => {
                            setQuoteText('');
                            setAuthorName('');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error(error);
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
                <Text style={styles.subtitle}>Design your quote masterpiece</Text>

                {/* Preview */}
                <View style={styles.previewContainer}>
                    <LinearGradient
                        colors={getMoodGradient(selectedTemplate.mood)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.preview}
                    >
                        <Text style={[
                            styles.previewText,
                            { fontFamily: selectedFont.family }
                        ]}>
                            {quoteText || 'Your quote will appear here...'}
                        </Text>
                        {authorName ? (
                            <Text style={styles.previewAuthor}>— {authorName}</Text>
                        ) : null}

                        {/* Watermark */}
                        <Text style={styles.watermark}>Quotiva ✨</Text>
                    </LinearGradient>
                </View>

                {/* Quote Input */}
                <Text style={styles.sectionTitle}>Your Quote</Text>
                <TextInput
                    style={styles.quoteInput}
                    placeholder="Enter your inspiring words..."
                    placeholderTextColor={colors.text.tertiary}
                    value={quoteText}
                    onChangeText={setQuoteText}
                    multiline
                    maxLength={200}
                />
                <Text style={styles.charCount}>{quoteText.length}/200</Text>

                {/* Author Input */}
                <Text style={styles.sectionTitle}>Author Name</Text>
                <TextInput
                    style={styles.authorInput}
                    placeholder="Who said this?"
                    placeholderTextColor={colors.text.tertiary}
                    value={authorName}
                    onChangeText={setAuthorName}
                    maxLength={50}
                />

                {/* Template Selector */}
                <Text style={styles.sectionTitle}>Choose Template</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.templateList}
                >
                    {TEMPLATES.map((template) => (
                        <Pressable
                            key={template.id}
                            onPress={() => handleTemplateSelect(template)}
                        >
                            <LinearGradient
                                colors={getMoodGradient(template.mood)}
                                style={[
                                    styles.templateCard,
                                    selectedTemplate.id === template.id && styles.templateSelected,
                                ]}
                            >
                                <Text style={styles.templateName}>{template.name}</Text>
                            </LinearGradient>
                        </Pressable>
                    ))}
                </ScrollView>

                {/* Font Selector */}
                <Text style={styles.sectionTitle}>Typography</Text>
                <View style={styles.fontList}>
                    {FONTS.map((font) => (
                        <Pressable
                            key={font.id}
                            style={[
                                styles.fontCard,
                                selectedFont.id === font.id && styles.fontSelected,
                            ]}
                            onPress={() => handleFontSelect(font)}
                        >
                            <Text style={[styles.fontPreview, { fontFamily: font.family }]}>Aa</Text>
                            <Text style={styles.fontName}>{font.name}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Export Button */}
                <Pressable
                    style={[styles.exportButton, isSubmitting && styles.exportButtonDisabled]}
                    onPress={handleExport}
                    disabled={isSubmitting}
                >
                    <Text style={styles.exportButtonText}>
                        {isSubmitting ? 'Publishing...' : 'Publish Quote ✨'}
                    </Text>
                </Pressable>

                {/* Remove Watermark CTA */}
                <Pressable style={styles.removeWatermarkButton}>
                    <Text style={styles.removeWatermarkText}>
                        🎬 Watch ad to remove watermark
                    </Text>
                </Pressable>

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
    previewContainer: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        marginBottom: spacing.lg,
    },
    preview: {
        aspectRatio: 9 / 16,
        maxHeight: 300,
        padding: spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewText: {
        ...textStyles.quoteText,
        color: colors.text.primary,
        textAlign: 'center',
        fontSize: 20,
    },
    previewAuthor: {
        ...textStyles.quoteAuthor,
        color: 'rgba(255,255,255,0.8)',
        marginTop: spacing.md,
    },
    watermark: {
        position: 'absolute',
        bottom: spacing.md,
        right: spacing.md,
        ...textStyles.caption,
        color: 'rgba(255,255,255,0.5)',
    },
    sectionTitle: {
        ...textStyles.subheading,
        color: colors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    quoteInput: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text.primary,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: colors.ui.border,
    },
    charCount: {
        ...textStyles.caption,
        color: colors.text.tertiary,
        textAlign: 'right',
        marginTop: spacing.xs,
    },
    authorInput: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        color: colors.text.primary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.ui.border,
    },
    templateList: {
        gap: spacing.sm,
        paddingVertical: spacing.xs,
    },
    templateCard: {
        width: 80,
        height: 100,
        borderRadius: borderRadius.md,
        justifyContent: 'flex-end',
        padding: spacing.sm,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    templateSelected: {
        borderColor: colors.text.primary,
    },
    templateName: {
        ...textStyles.caption,
        color: colors.text.primary,
        fontWeight: '600',
    },
    fontList: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    fontCard: {
        flex: 1,
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    fontSelected: {
        borderColor: colors.accent.gold,
    },
    fontPreview: {
        fontSize: 28,
        color: colors.text.primary,
    },
    fontName: {
        ...textStyles.caption,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    exportButton: {
        backgroundColor: colors.accent.gold,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    exportButtonDisabled: {
        opacity: 0.7,
    },
    exportButtonText: {
        ...textStyles.body,
        color: colors.background.primary,
        fontWeight: '700',
    },
    removeWatermarkButton: {
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    removeWatermarkText: {
        ...textStyles.caption,
        color: colors.text.tertiary,
    },
    bottomPadding: {
        height: 100,
    },
});

export default CreateScreen;
