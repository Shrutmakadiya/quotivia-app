import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_FIRST_QUOTE_KEY = '@QuotesHub:last_first_quote_id';
const SESSION_SEED = `${Date.now()}_${Math.floor(Math.random() * 1000000000)}`;

let hasRecordedSessionFirstQuote = false;

const getQuoteId = (quote = {}) => (
    quote?._id ||
    quote?.id ||
    quote?.imageUrl ||
    `${quote?.author || ''}:${quote?.text || ''}`
);

const hashString = (value = '') => {
    let hash = 2166136261;

    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }

    return hash >>> 0;
};

export const orderQuotesForSession = (quotes = []) => {
    if (!Array.isArray(quotes)) return [];
    if (quotes.length <= 1) return [...quotes];

    return [...quotes].sort((a, b) => {
        const aScore = hashString(`${SESSION_SEED}:${getQuoteId(a)}`);
        const bScore = hashString(`${SESSION_SEED}:${getQuoteId(b)}`);
        return aScore - bScore;
    });
};

export const orderQuotesForSessionNoImmediateRepeat = async (quotes = []) => {
    const orderedQuotes = orderQuotesForSession(quotes);

    if (orderedQuotes.length === 0) {
        return orderedQuotes;
    }

    if (hasRecordedSessionFirstQuote) {
        return orderedQuotes;
    }

    try {
        const lastFirstQuoteId = await AsyncStorage.getItem(LAST_FIRST_QUOTE_KEY);
        const firstQuoteId = getQuoteId(orderedQuotes[0]);

        if (
            orderedQuotes.length > 1 &&
            firstQuoteId &&
            lastFirstQuoteId &&
            firstQuoteId === lastFirstQuoteId
        ) {
            [orderedQuotes[0], orderedQuotes[1]] = [orderedQuotes[1], orderedQuotes[0]];
        }

        const nextFirstQuoteId = getQuoteId(orderedQuotes[0]);
        if (nextFirstQuoteId) {
            await AsyncStorage.setItem(LAST_FIRST_QUOTE_KEY, nextFirstQuoteId);
        }
    } catch (error) {
        console.log('Quote order storage failed:', error?.message || error);
    } finally {
        hasRecordedSessionFirstQuote = true;
    }

    return orderedQuotes;
};

