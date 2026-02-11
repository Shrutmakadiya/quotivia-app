// Full-screen Quote Card Component with Stitched Theme
// Combines particle background, kinetic typography, and gestures
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Heart, Bookmark, Send, Download, Ellipsis } from 'lucide-react-native';


import ParticleBackground from './ParticleBackground';
import KineticQuote from './KineticQuote';
import { colors, textStyles, getMoodGradient } from '../theme';
import { getQuoteBackgroundImage } from '../utils/imageMapper';
import { getQuoteImageSource } from '../assets/quotes';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const QuoteCard = ({
  quote,
  onSwipeUp,    // Next quote
  onSwipeDown,  // Author bio
  onSwipeLeft,  // Share
  onSwipeRight, // Download
  onLike,       // Like quote
  onSave,       // Save quote
  onQuoteRead,  // Track reading
  showAnimation = true,
  index,
  initialLiked = false,
  initialSaved = false,
}) => {
  const [animationComplete, setAnimationComplete] = useState(!showAnimation);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);

  // Sync state with props
  useEffect(() => {
    setIsLiked(initialLiked);
    setIsSaved(initialSaved);
  }, [initialLiked, initialSaved]);

  // Gesture values
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  // Heart animation values
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  // Bookmark animation values
  const bookmarkScale = useSharedValue(0);
  const bookmarkOpacity = useSharedValue(0);

  // Default quote structure
  const quoteData = quote || {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    mood: "hope",
    particleTheme: "firefly",
  };

  const imageSource = getQuoteImageSource(quoteData.imageUrl);

  // Handle like with animation
  const triggerLikeAnimation = () => {
    setIsLiked(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Trigger heart animation
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withSpring(1.2, { damping: 6 }),
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 })
    );
    heartOpacity.value = withSequence(
      withTiming(1, { duration: 0 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 200 })
    );

    // Call the like handler
    onLike && onLike(quoteData);
  };

  // Double tap gesture for like
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(triggerLikeAnimation)();
    });

  // Pan gesture for swipe actions (Horizontal only for actions)
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    .onStart(() => {
      scale.value = withSpring(0.98);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX * 0.5;
    })
    .onEnd((event) => {
      const { translationX, velocityX } = event;

      translateX.value = withSpring(0);
      scale.value = withSpring(1);

      const swipeThreshold = 50;
      const velocityThreshold = 200;

      if (translationX < -swipeThreshold || velocityX < -velocityThreshold) {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        onSwipeLeft && runOnJS(onSwipeLeft)(quoteData);
      }
      else if (translationX > swipeThreshold || velocityX > velocityThreshold) {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        onSwipeRight && runOnJS(onSwipeRight)(quoteData);
      }
    });

  // Combine gestures - double tap takes priority
  const composedGesture = Gesture.Race(doubleTapGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
    onQuoteRead && onQuoteRead(quoteData);
  };

  // Handle like button press
  const handleLikePress = () => {
    triggerLikeAnimation();
  };

  // Handle save button press with animation
  const handleSavePress = () => {
    setIsSaved(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Trigger bookmark animation
    bookmarkOpacity.value = 1;
    bookmarkScale.value = withSequence(
      withSpring(1.2, { damping: 6 }),
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 })
    );
    bookmarkOpacity.value = withSequence(
      withTiming(1, { duration: 0 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 200 })
    );

    onSave && onSave(quoteData);
  };

  const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
    opacity: bookmarkOpacity.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.authorRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{quoteData.author?.charAt(0) || '?'}</Text>
            </View>
            <View>
              <Text style={styles.headerAuthor}>{quoteData.author}</Text>
              <Text style={styles.headerSubtext}>{quoteData.category || 'Inspiration'}</Text>
            </View>
          </View>
          {/* <Ellipsis size={20} color={colors.text.tertiary} /> */}
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {imageSource ? (
            <View style={styles.imageContainer}>
              <Image
                source={imageSource}
                style={styles.quoteImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <>
              <View style={styles.fabricBackground} />
              <View style={styles.stitchedFrame}>
                <Text style={styles.quoteIcon}>❝</Text>
                {showAnimation ? (
                  <KineticQuote
                    text={quoteData.text}
                    onComplete={handleAnimationComplete}
                  />
                ) : (
                  <Text style={styles.quoteText}>{quoteData.text || "No quote text available"}</Text>
                )}
              </View>
            </>
          )}

          {/* Heart Animation Overlay */}
          <Animated.View style={[styles.heartOverlay, heartAnimatedStyle]}>
            <Heart size={100} color="#ff3b5c" fill="#ff3b5c" />
          </Animated.View>

          {/* Bookmark Animation Overlay */}
          <Animated.View style={[styles.heartOverlay, bookmarkAnimatedStyle]}>
            <Bookmark size={80} color={colors.accent.gold} fill={colors.accent.gold} />
          </Animated.View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <View style={styles.actionsRow}>
            <View style={styles.leftActions}>
              <Pressable style={styles.actionBtn} onPress={handleLikePress}>
                <Heart
                  size={26}
                  color={isLiked ? "#ff3b5c" : colors.text.primary}
                  fill={isLiked ? "#ff3b5c" : "transparent"}
                />
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => onSwipeLeft && onSwipeLeft(quoteData)}>
                <Send size={24} color={colors.text.primary} />
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => onSwipeRight && onSwipeRight(quoteData)}>
                <Download size={24} color={colors.text.primary} />
              </Pressable>
            </View>
            <Pressable style={styles.actionBtn} onPress={handleSavePress}>
              <Bookmark
                size={24}
                color={isSaved ? colors.accent.gold : colors.text.primary}
                fill={isSaved ? colors.accent.gold : "transparent"}
              />
            </Pressable>
          </View>

          <Text style={styles.likesText}>
            {quoteData.likesCount > 0 
              ? `Liked by ${quoteData.likesCount.toLocaleString()} souls` 
              : 'Be the first to like'}
          </Text>

          <View style={styles.captionContainer}>
            <Text style={styles.captionText}>
              <Text style={styles.captionAuthor}>{quoteData.author}</Text> {quoteData.text ? quoteData.text.substring(0, 40) + '...' : ''}
            </Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    backgroundColor: colors.background.primary,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  headerAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtext: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  contentArea: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.1,
    position: 'relative',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  quoteImage: {
    width: '100%',
    height: '100%',
  },
  fabricBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.secondary,
  },
  stitchedFrame: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent.gold,
    borderStyle: 'dashed',
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  quoteIcon: {
    fontSize: 40,
    color: colors.accent.gold,
    opacity: 0.3,
    marginBottom: 16,
  },
  quoteText: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 34,
  },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  likesText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  captionContainer: {
    marginTop: 4,
  },
  captionText: {
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
  captionAuthor: {
    fontWeight: '700',
  },
});

export default QuoteCard;
