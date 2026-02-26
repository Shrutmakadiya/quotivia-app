// API Service for Backend Communication
// const API_BASE_URL = 'https://quotiva-theta.vercel.app/api';
// const API_BASE_URL = 'https://QuotesHub-ydcx.onrender.com/api';
const API_BASE_URL = "http://localhost:3001/api";

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Quote endpoints
    async getQuotes(page = 1, limit = 20) {
        return this.request(`/quotes?page=${page}&limit=${limit}`);
    }

    async getTrendingQuotes() {
        return this.request('/quotes/trending');
    }

    async getQuotesByMood(mood, page = 1) {
        return this.request(`/quotes/mood/${mood}?page=${page}`);
    }

    async getFeaturedQuotes() {
        return this.request('/quotes/featured');
    }

    async getRandomQuote() {
        return this.request('/quotes/random');
    }

    async getCategoryCounts() {
        return this.request('/quotes/categories');
    }

    async searchQuotes(query) {
        return this.request(`/quotes/search/${encodeURIComponent(query)}`);
    }

    async incrementViewCount(quoteId) {
        return this.request(`/quotes/${quoteId}/view`, {
            method: 'POST',
        });
    }

    // User endpoints
    async getUser(deviceHash) {
        return this.request(`/users/${deviceHash}`);
    }

    async getLikedAndSavedQuotes(deviceHash) {
        return this.request(`/users/${deviceHash}/liked-saved`);
    }

    async syncStreak(deviceHash, streakData) {
        return this.request('/users/sync-streak', {
            method: 'POST',
            body: JSON.stringify({ deviceHash, streakData }),
        });
    }

    async recordQuoteView(deviceHash, quoteId) {
        return this.request('/users/record-view', {
            method: 'POST',
            body: JSON.stringify({ deviceHash, quoteId }),
        });
    }

    async saveQuote(deviceHash, quoteId, collectionName = null) {
        return this.request('/users/save-quote', {
            method: 'POST',
            body: JSON.stringify({ deviceHash, quoteId, collectionName }),
        });
    }

    async getUserBadges(deviceHash) {
        return this.request(`/users/${deviceHash}/badges`);
    }

    async getSavedQuotes(deviceHash) {
        return this.request(`/users/${deviceHash}/saved`);
    }

    async updatePreferences(deviceHash, preferences) {
        return this.request(`/users/${deviceHash}/preferences`, {
            method: 'PATCH',
            body: JSON.stringify({ preferences }),
        });
    }

    async unsaveQuote(deviceHash, quoteId) {
        return this.request('/users/unsave-quote', {
            method: 'POST',
            body: JSON.stringify({ deviceHash, quoteId }),
        });
    }

    async likeQuote(deviceHash, quoteId) {
        return this.request(`/quotes/${quoteId}/like`, {
            method: 'POST',
            body: JSON.stringify({ deviceHash }),
        });
    }

    async unlikeQuote(deviceHash, quoteId) {
        return this.request(`/quotes/${quoteId}/unlike`, {
            method: 'POST',
            body: JSON.stringify({ deviceHash }),
        });
    }

    async getQuotesByCategory(category, page = 1) {
        return this.request(`/quotes/category/${category}?page=${page}`);
    }
}

export const api = new ApiService();
export default api;
