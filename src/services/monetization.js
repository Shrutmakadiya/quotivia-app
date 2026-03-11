import { Platform } from 'react-native';
import api from './api';

const CONFIG_CACHE_TTL_MS = 2 * 60 * 1000;

const SAMPLE_UNIT_IDS = {
    appOpen: {
        android: 'ca-app-pub-3940256099942544/9257395921',
        ios: 'ca-app-pub-3940256099942544/5575463023',
    },
    banner: {
        android: 'ca-app-pub-3940256099942544/6300978111',
        ios: 'ca-app-pub-3940256099942544/2934735716',
    },
    interstitial: {
        android: 'ca-app-pub-3940256099942544/1033173712',
        ios: 'ca-app-pub-3940256099942544/4411468910',
    },
    rewarded: {
        android: 'ca-app-pub-3940256099942544/5224354917',
        ios: 'ca-app-pub-3940256099942544/1712485313',
    },
};

const DEFAULT_MONETIZATION_CONFIG = Object.freeze({
    revision: 'local-fallback',
    globalEnabled: false,
    testMode: true,
    blockedForDevice: false,
    blockedUntil: null,
    features: {
        nonHdDownloadEnabled: true,
        hdDownloadEnabled: true,
        streakReviveEnabled: true,
        trendingRewardUnlockEnabled: true,
    },
    rules: {
        appOpenCooldownSeconds: 14400,
        appOpenSessionCap: 1,
        appOpenMinSecondsSinceSessionStart: 30,
        interstitialCooldownSeconds: 180,
        interstitialSessionCap: 2,
        interstitialMinActions: 4,
        minAppOpenSecondsBeforeInterstitial: 45,
        shareActionsPerInterstitial: 3,
    },
    placements: {
        appOpen: { enabled: false, adType: 'app_open', unitIds: SAMPLE_UNIT_IDS.appOpen },
        splash: { enabled: false, adType: 'none', unitIds: {} },
        homeBanner: { enabled: false, adType: 'banner', unitIds: SAMPLE_UNIT_IDS.banner },
        discoverBanner: { enabled: false, adType: 'banner', unitIds: SAMPLE_UNIT_IDS.banner },
        savedBanner: { enabled: false, adType: 'banner', unitIds: SAMPLE_UNIT_IDS.banner },
        profileBanner: { enabled: false, adType: 'banner', unitIds: SAMPLE_UNIT_IDS.banner },
        homeInterstitial: { enabled: false, adType: 'interstitial', unitIds: SAMPLE_UNIT_IDS.interstitial },
        hdDownloadRewarded: { enabled: false, adType: 'rewarded', unitIds: SAMPLE_UNIT_IDS.rewarded },
        streakReviveRewarded: { enabled: false, adType: 'rewarded', unitIds: SAMPLE_UNIT_IDS.rewarded },
        trendingRewarded: { enabled: false, adType: 'rewarded', unitIds: SAMPLE_UNIT_IDS.rewarded },
    },
    safety: {
        blockAdsForSuspiciousDevices: true,
        blockDurationHours: 24,
        maxAdEventsPerMinute: 40,
        maxClicksPerMinute: 8,
        maxInterstitialShowsPerHour: 8,
        maxRewardedEarnsPerHour: 20,
    },
});

let cachedConfig = null;
let lastConfigFetchAt = 0;

const shallowMergePlacement = (placementName, incomingPlacement) => {
    const fallback = DEFAULT_MONETIZATION_CONFIG.placements[placementName] || {};
    return {
        ...fallback,
        ...(incomingPlacement || {}),
        unitIds: {
            ...(fallback.unitIds || {}),
            ...(incomingPlacement?.unitIds || {}),
        },
    };
};

const sanitizeMonetizationConfig = (raw) => {
    const placements = Object.keys(DEFAULT_MONETIZATION_CONFIG.placements).reduce((acc, key) => {
        acc[key] = shallowMergePlacement(key, raw?.placements?.[key]);
        return acc;
    }, {});

    return {
        ...DEFAULT_MONETIZATION_CONFIG,
        ...(raw || {}),
        features: {
            ...DEFAULT_MONETIZATION_CONFIG.features,
            ...(raw?.features || {}),
        },
        rules: {
            ...DEFAULT_MONETIZATION_CONFIG.rules,
            ...(raw?.rules || {}),
        },
        safety: {
            ...DEFAULT_MONETIZATION_CONFIG.safety,
            ...(raw?.safety || {}),
        },
        placements,
    };
};

export const getDefaultMonetizationConfig = () => DEFAULT_MONETIZATION_CONFIG;

export const fetchMonetizationConfig = async ({ deviceId, force = false } = {}) => {
    const now = Date.now();
    if (!force && cachedConfig && now - lastConfigFetchAt <= CONFIG_CACHE_TTL_MS) {
        return cachedConfig;
    }

    try {
        const remoteConfig = await api.getMonetizationConfig({
            platform: Platform.OS,
            deviceHash: deviceId || '',
        });

        cachedConfig = sanitizeMonetizationConfig(remoteConfig);
        lastConfigFetchAt = now;
        return cachedConfig;
    } catch (error) {
        if (cachedConfig) {
            return cachedConfig;
        }
        return sanitizeMonetizationConfig(DEFAULT_MONETIZATION_CONFIG);
    }
};

export const getPlacementConfig = (config, placementName) => {
    const safeConfig = config || DEFAULT_MONETIZATION_CONFIG;
    return safeConfig.placements?.[placementName]
        || DEFAULT_MONETIZATION_CONFIG.placements[placementName]
        || null;
};

export const isPlacementEnabled = (config, placementName) => {
    const placement = getPlacementConfig(config, placementName);
    if (!placement) return false;
    if (!config?.globalEnabled) return false;
    if (config?.blockedForDevice) return false;
    return placement.enabled !== false;
};

export const getPlacementUnitId = (config, placementName) => {
    const placement = getPlacementConfig(config, placementName);
    if (!placement?.unitIds) return null;
    if (Platform.OS === 'ios') return placement.unitIds.ios || null;
    return placement.unitIds.android || null;
};

export const clearMonetizationConfigCache = () => {
    cachedConfig = null;
    lastConfigFetchAt = 0;
};
