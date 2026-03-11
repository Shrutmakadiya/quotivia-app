// Image Base URL for server-hosted images
import { IMAGE_BASE_URL } from '../config/network';

// Local assets map (optional - for bundled images)
// You can keep bundled images here, or leave empty
export const quoteImages = {
    // Keep local assets if you still have them, or leave empty
};

// Helper to resolve image source
// Priority: Full URL > Server hosted > Local asset > null
export const getQuoteImageSource = (imageUrl) => {
    if (!imageUrl) return null;

    // If it's already a full URL (http/https), use as-is
    if (imageUrl.startsWith('http')) {
        return { uri: imageUrl };
    }

    // Check if it's in local map first (bundled assets)
    if (quoteImages[imageUrl]) {
        return quoteImages[imageUrl];
    }

    // Otherwise, assume it's a server filename - load from backend
    // This handles both user-uploaded images and seeded images
    return { uri: `${IMAGE_BASE_URL}/${imageUrl}` };
};
