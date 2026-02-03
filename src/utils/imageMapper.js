// Image Mapper Utility
// Maps quote moods to high-quality background images

// Using Lorem Picsum - highly reliable for React Native
// Format: https://picsum.photos/id/{id}/800/1200
const MOOD_IMAGES = {
    hope: [
        'https://picsum.photos/id/1015/800/1200', // River mountains
        'https://picsum.photos/id/1018/800/1200', // Forest lake
        'https://picsum.photos/id/1043/800/1200', // Beach sunset
        'https://picsum.photos/id/1047/800/1200', // Sunrise ocean
        'https://picsum.photos/id/1051/800/1200', // Mountain peak
        'https://picsum.photos/id/1036/800/1200', // Ocean view
    ],
    calm: [
        'https://picsum.photos/id/1039/800/1200', // Misty water
        'https://picsum.photos/id/1082/800/1200', // Ocean waves
        'https://picsum.photos/id/1011/800/1200', // Lake forest
        'https://picsum.photos/id/1020/800/1200', // Foggy trees
        'https://picsum.photos/id/1024/800/1200', // Mountain range
        'https://picsum.photos/id/1041/800/1200', // Lake reflection
    ],
    melancholy: [
        'https://picsum.photos/id/1002/800/1200', // Autumn forest
        'https://picsum.photos/id/1003/800/1200', // Dark forest
        'https://picsum.photos/id/1006/800/1200', // Cloudy sky
        'https://picsum.photos/id/1009/800/1200', // Moody hills
        'https://picsum.photos/id/1012/800/1200', // Dark water
        'https://picsum.photos/id/1005/800/1200', // Forest mist
    ],
    wisdom: [
        'https://picsum.photos/id/1025/800/1200', // Night forest
        'https://picsum.photos/id/1045/800/1200', // Mountain sky
        'https://picsum.photos/id/1055/800/1200', // Stars night
        'https://picsum.photos/id/1069/800/1200', // Dark landscape
        'https://picsum.photos/id/1084/800/1200', // Nature abstract
        'https://picsum.photos/id/1057/800/1200', // Cosmic view
    ],
    motivation: [
        'https://picsum.photos/id/1054/800/1200', // Mountain climb
        'https://picsum.photos/id/1019/800/1200', // Ocean sunrise
        'https://picsum.photos/id/1029/800/1200', // Peak view
        'https://picsum.photos/id/1083/800/1200', // Rocky terrain
        'https://picsum.photos/id/1077/800/1200', // Desert sunset
        'https://picsum.photos/id/1080/800/1200', // Highway road
    ],
    love: [
        'https://picsum.photos/id/1044/800/1200', // Sunset colors
        'https://picsum.photos/id/1076/800/1200', // Warm sunset
        'https://picsum.photos/id/1022/800/1200', // Beach waves
        'https://picsum.photos/id/1067/800/1200', // Rose flowers
        'https://picsum.photos/id/1078/800/1200', // Warm light
        'https://picsum.photos/id/1058/800/1200', // Soft colors
    ],
    default: [
        'https://picsum.photos/id/1031/800/1200', // Abstract nature
        'https://picsum.photos/id/1037/800/1200', // Ocean waves
        'https://picsum.photos/id/1060/800/1200', // Mountain view
        'https://picsum.photos/id/1071/800/1200', // Forest path
        'https://picsum.photos/id/1074/800/1200', // Nature view
        'https://picsum.photos/id/1081/800/1200', // Sky clouds
    ],
};

/**
 * Get a background image URL for a quote based on its mood
 * @param {Object} quote - The quote object with mood property
 * @returns {string} - A URL to a high-quality background image
 */
export const getQuoteBackgroundImage = (quote) => {
    const mood = quote?.mood?.toLowerCase() || 'default';
    const images = MOOD_IMAGES[mood] || MOOD_IMAGES.default;

    // Use quote ID or text length to consistently pick the same image for the same quote
    let index = 0;
    if (quote?._id) {
        // Convert last characters of ID to a number
        const idNum = parseInt(quote._id.slice(-4), 16) || 0;
        index = idNum % images.length;
    } else if (quote?.text) {
        index = quote.text.length % images.length;
    }

    return images[index];
};

/**
 * Get all available images for a specific mood
 * @param {string} mood - The mood category
 * @returns {string[]} - Array of image URLs
 */
export const getMoodImages = (mood) => {
    return MOOD_IMAGES[mood?.toLowerCase()] || MOOD_IMAGES.default;
};

/**
 * Get a random background image from any mood
 * @returns {string} - A random image URL
 */
export const getRandomBackgroundImage = () => {
    const allImages = Object.values(MOOD_IMAGES).flat();
    return allImages[Math.floor(Math.random() * allImages.length)];
};

export default {
    getQuoteBackgroundImage,
    getMoodImages,
    getRandomBackgroundImage,
    MOOD_IMAGES,
};
