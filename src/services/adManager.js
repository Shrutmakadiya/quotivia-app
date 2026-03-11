import mobileAds, {
    AdEventType,
    AppOpenAd,
    InterstitialAd,
    MaxAdContentRating,
    RewardedAd,
    RewardedAdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';
import api from './api';
import { getPlacementUnitId, isPlacementEnabled } from './monetization';

const REQUEST_NON_PERSONALIZED_ADS_ONLY = true;
const AD_LOAD_TIMEOUT_MS = 30000;
const AD_SHOW_TIMEOUT_MS = 60000;
const REWARDED_LOAD_ATTEMPTS = 2;
const REWARDED_RELOAD_BACKOFF_MS = 900;

const managerState = {
    initialized: false,
    sessionStartedAt: Date.now(),
    totalActions: 0,
    actionCounts: {},
    lastInterstitialAt: 0,
    interstitialsThisSession: 0,
    lastAppOpenAt: 0,
    appOpenThisSession: 0,
    appOpenInFlight: false,
};
const rewardedSlots = new Map();

const safeLogAdEvent = async ({ deviceId, eventType, adType, placement }) => {
    if (!deviceId) return;
    try {
        await api.logAdEvent({
            deviceHash: deviceId,
            eventType,
            adType,
            placement,
        });
    } catch (error) {
        // Keep ad flow resilient when telemetry is unavailable.
    }
};

const getAdUnitId = (config, placement, adType) => {
    if (config?.testMode === true) {
        if (adType === 'app_open') return TestIds.APP_OPEN;
        if (adType === 'interstitial') return TestIds.INTERSTITIAL;
        if (adType === 'rewarded') return TestIds.REWARDED;
    }

    const unitId = getPlacementUnitId(config, placement);
    if (!unitId) {
        if (adType === 'app_open') return TestIds.APP_OPEN;
        if (adType === 'interstitial') return TestIds.INTERSTITIAL;
        if (adType === 'rewarded') return TestIds.REWARDED;
    }
    return unitId;
};

const withTimeout = (promise, timeoutMs) => new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
        reject(new Error(`Ad load timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
        .then((result) => {
            clearTimeout(timeoutId);
            resolve(result);
        })
        .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
        });
});

const createRequestOptions = () => ({
    requestNonPersonalizedAdsOnly: REQUEST_NON_PERSONALIZED_ADS_ONLY,
});

const formatAdErrorMessage = (error) => {
    if (!error) return '';
    if (typeof error?.message === 'string' && error.message.trim()) return error.message.trim();
    if (typeof error === 'string' && error.trim()) return error.trim();

    try {
        return JSON.stringify(error);
    } catch (stringifyError) {
        return String(error);
    }
};

const getOrCreateRewardedSlot = ({ placement, adUnitId }) => {
    let slot = rewardedSlots.get(placement);

    if (!slot || slot.adUnitId !== adUnitId) {
        slot = {
            placement,
            adUnitId,
            ad: RewardedAd.createForAdRequest(adUnitId, createRequestOptions()),
            loaded: false,
            loadingPromise: null,
            showInFlight: false,
            lastErrorMessage: '',
        };
        rewardedSlots.set(placement, slot);
        return slot;
    }

    if (!slot.ad) {
        slot.ad = RewardedAd.createForAdRequest(adUnitId, createRequestOptions());
    }

    return slot;
};

const ensureRewardedLoaded = async (slot, { timeoutMs = AD_LOAD_TIMEOUT_MS, force = false } = {}) => {
    if (!slot?.ad) {
        throw new Error('Rewarded slot has no ad instance');
    }

    if (slot.loaded && !force) {
        return true;
    }

    if (slot.loadingPromise && !force) {
        await withTimeout(slot.loadingPromise, timeoutMs);
        return true;
    }

    const loadPromise = new Promise((resolve, reject) => {
        let unsubscribeLoaded = () => {};
        let unsubscribeError = () => {};

        const cleanup = () => {
            try { unsubscribeLoaded(); } catch (error) {}
            try { unsubscribeError(); } catch (error) {}
        };

        unsubscribeLoaded = slot.ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
            cleanup();
            slot.loaded = true;
            slot.lastErrorMessage = '';
            resolve(true);
        });

        unsubscribeError = slot.ad.addAdEventListener(AdEventType.ERROR, (error) => {
            cleanup();
            slot.loaded = false;
            slot.lastErrorMessage = formatAdErrorMessage(error);
            reject(error);
        });
    });

    slot.loadingPromise = loadPromise;
    slot.loaded = false;
    slot.ad.load();

    try {
        await withTimeout(loadPromise, timeoutMs);
        return true;
    } finally {
        if (slot.loadingPromise === loadPromise) {
            slot.loadingPromise = null;
        }
    }
};

const rebuildRewardedSlot = (slot) => {
    if (!slot?.adUnitId) return;
    slot.ad = RewardedAd.createForAdRequest(slot.adUnitId, createRequestOptions());
    slot.loaded = false;
    slot.loadingPromise = null;
};

const queueRewardedPreload = async ({ slot, deviceId }) => {
    if (!slot) return;
    try {
        await ensureRewardedLoaded(slot);
    } catch (error) {
        slot.lastErrorMessage = formatAdErrorMessage(error);
        await safeLogAdEvent({
            deviceId,
            adType: 'rewarded',
            placement: slot.placement,
            eventType: 'error',
        });
    }
};

export const initializeAdManager = async () => {
    if (managerState.initialized) return;

    await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.T,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
    managerState.initialized = true;
};

export const recordMonetizationAction = (actionType = 'generic') => {
    managerState.totalActions += 1;
    managerState.actionCounts[actionType] = (managerState.actionCounts[actionType] || 0) + 1;
};

const isInterstitialEligible = ({ config, placement, actionType }) => {
    if (!isPlacementEnabled(config, placement)) return false;

    const rules = config?.rules || {};
    const cooldownMs = (rules.interstitialCooldownSeconds || 0) * 1000;
    const sessionCap = rules.interstitialSessionCap || 0;
    const minActions = rules.interstitialMinActions || 0;
    const minOpenMs = (rules.minAppOpenSecondsBeforeInterstitial || 0) * 1000;
    const shareActionsPerInterstitial = Math.max(1, rules.shareActionsPerInterstitial || 1);

    const now = Date.now();
    if (cooldownMs > 0 && now - managerState.lastInterstitialAt < cooldownMs) return false;
    if (sessionCap > 0 && managerState.interstitialsThisSession >= sessionCap) return false;
    if (minActions > 0 && managerState.totalActions < minActions) return false;
    if (minOpenMs > 0 && now - managerState.sessionStartedAt < minOpenMs) return false;

    if (actionType === 'share') {
        const shareCount = managerState.actionCounts.share || 0;
        if (shareCount === 0 || shareCount % shareActionsPerInterstitial !== 0) return false;
    }

    return true;
};

const isAppOpenEligible = ({ config, placement }) => {
    if (!isPlacementEnabled(config, placement)) return false;
    if (managerState.appOpenInFlight) return false;

    const rules = config?.rules || {};
    const cooldownMs = (rules.appOpenCooldownSeconds || 0) * 1000;
    const sessionCap = rules.appOpenSessionCap || 0;
    const minSessionOpenMs = (rules.appOpenMinSecondsSinceSessionStart || 0) * 1000;

    const now = Date.now();
    if (cooldownMs > 0 && now - managerState.lastAppOpenAt < cooldownMs) return false;
    if (sessionCap > 0 && managerState.appOpenThisSession >= sessionCap) return false;
    if (minSessionOpenMs > 0 && now - managerState.sessionStartedAt < minSessionOpenMs) return false;

    return true;
};

export const showManagedAppOpen = async ({
    config,
    deviceId,
    placement = 'appOpen',
}) => {
    if (!isAppOpenEligible({ config, placement })) {
        return false;
    }

    const adUnitId = getAdUnitId(config, placement, 'app_open');
    if (!adUnitId) return false;

    managerState.appOpenInFlight = true;

    try {
        await initializeAdManager();
        const appOpen = AppOpenAd.createForAdRequest(adUnitId, createRequestOptions());
        let loaded = false;

        const waitForLoad = new Promise((resolve, reject) => {
            const unsubscribeLoaded = appOpen.addAdEventListener(AdEventType.LOADED, () => {
                loaded = true;
                unsubscribeLoaded();
                resolve(true);
            });
            const unsubscribeError = appOpen.addAdEventListener(AdEventType.ERROR, (error) => {
                unsubscribeLoaded();
                unsubscribeError();
                reject(error);
            });
        });

        appOpen.addAdEventListener(AdEventType.OPENED, () => {
            safeLogAdEvent({ deviceId, adType: 'app_open', placement, eventType: 'opened' });
        });
        appOpen.addAdEventListener(AdEventType.CLOSED, () => {
            safeLogAdEvent({ deviceId, adType: 'app_open', placement, eventType: 'closed' });
        });
        appOpen.addAdEventListener(AdEventType.CLICKED, () => {
            safeLogAdEvent({ deviceId, adType: 'app_open', placement, eventType: 'clicked' });
        });

        appOpen.load();
        await withTimeout(waitForLoad, AD_LOAD_TIMEOUT_MS);
        if (!loaded) return false;

        await safeLogAdEvent({ deviceId, adType: 'app_open', placement, eventType: 'shown' });
        const closePromise = new Promise((resolve) => {
            const unsubscribe = appOpen.addAdEventListener(AdEventType.CLOSED, () => {
                unsubscribe();
                resolve(true);
            });
        });
        appOpen.show();
        await withTimeout(closePromise, 30000);

        managerState.lastAppOpenAt = Date.now();
        managerState.appOpenThisSession += 1;
        return true;
    } catch (error) {
        await safeLogAdEvent({ deviceId, adType: 'app_open', placement, eventType: 'error' });
        return false;
    } finally {
        managerState.appOpenInFlight = false;
    }
};

export const showManagedInterstitial = async ({
    config,
    deviceId,
    placement = 'homeInterstitial',
    actionType = 'generic',
}) => {
    if (!isInterstitialEligible({ config, placement, actionType })) {
        return false;
    }

    const adUnitId = getAdUnitId(config, placement, 'interstitial');
    if (!adUnitId) return false;

    try {
        await initializeAdManager();
        const interstitial = InterstitialAd.createForAdRequest(adUnitId, createRequestOptions());
        let loaded = false;

        const waitForLoad = new Promise((resolve, reject) => {
            const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
                loaded = true;
                unsubscribeLoaded();
                resolve(true);
            });
            const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
                unsubscribeLoaded();
                unsubscribeError();
                reject(error);
            });
        });

        interstitial.addAdEventListener(AdEventType.OPENED, () => {
            safeLogAdEvent({ deviceId, adType: 'interstitial', placement, eventType: 'opened' });
        });
        interstitial.addAdEventListener(AdEventType.CLOSED, () => {
            safeLogAdEvent({ deviceId, adType: 'interstitial', placement, eventType: 'closed' });
        });
        interstitial.addAdEventListener(AdEventType.CLICKED, () => {
            safeLogAdEvent({ deviceId, adType: 'interstitial', placement, eventType: 'clicked' });
        });

        interstitial.load();
        await withTimeout(waitForLoad, AD_LOAD_TIMEOUT_MS);

        if (!loaded) return false;
        await safeLogAdEvent({ deviceId, adType: 'interstitial', placement, eventType: 'shown' });
        interstitial.show();

        managerState.lastInterstitialAt = Date.now();
        managerState.interstitialsThisSession += 1;
        return true;
    } catch (error) {
        await safeLogAdEvent({ deviceId, adType: 'interstitial', placement, eventType: 'error' });
        return false;
    }
};

export const preloadManagedRewarded = async ({
    config,
    deviceId,
    placement,
}) => {
    if (!isPlacementEnabled(config, placement)) {
        return {
            loaded: false,
            reason: 'placement_disabled',
        };
    }

    const adUnitId = getAdUnitId(config, placement, 'rewarded');
    if (!adUnitId) {
        return {
            loaded: false,
            reason: 'missing_ad_unit',
        };
    }

    try {
        await initializeAdManager();
        const slot = getOrCreateRewardedSlot({ placement, adUnitId });
        await ensureRewardedLoaded(slot);
        return { loaded: true, reason: 'loaded' };
    } catch (error) {
        const errorMessage = formatAdErrorMessage(error);
        await safeLogAdEvent({ deviceId, adType: 'rewarded', placement, eventType: 'error' });
        return {
            loaded: false,
            reason: 'load_failed',
            errorMessage,
        };
    }
};

export const showManagedRewarded = async ({
    config,
    deviceId,
    placement,
}) => {
    if (!isPlacementEnabled(config, placement)) {
        return {
            shown: false,
            rewardEarned: false,
            reason: 'placement_disabled',
        };
    }

    const adUnitId = getAdUnitId(config, placement, 'rewarded');
    if (!adUnitId) {
        return {
            shown: false,
            rewardEarned: false,
            reason: 'missing_ad_unit',
        };
    }

    await initializeAdManager();
    const slot = getOrCreateRewardedSlot({ placement, adUnitId });

    if (slot.showInFlight) {
        return {
            shown: false,
            rewardEarned: false,
            reason: 'show_in_progress',
        };
    }

    let lastErrorMessage = slot.lastErrorMessage || '';
    let rewardedLoaded = false;

    for (let attempt = 1; attempt <= REWARDED_LOAD_ATTEMPTS; attempt += 1) {
        try {
            await ensureRewardedLoaded(slot, { force: attempt > 1 });
            rewardedLoaded = true;
            break;
        } catch (error) {
            lastErrorMessage = formatAdErrorMessage(error);
            await safeLogAdEvent({ deviceId, adType: 'rewarded', placement, eventType: 'error' });

            if (attempt < REWARDED_LOAD_ATTEMPTS) {
                rebuildRewardedSlot(slot);
                await new Promise((resolve) => setTimeout(resolve, REWARDED_RELOAD_BACKOFF_MS));
                continue;
            }
        }
    }

    if (!rewardedLoaded) {
        return {
            shown: false,
            rewardEarned: false,
            reason: 'load_or_show_failed',
            errorMessage: lastErrorMessage || slot.lastErrorMessage,
        };
    }

    slot.showInFlight = true;
    slot.loaded = false;

    let rewardEarned = false;
    const unsubscribeFns = [];
    const addListener = (eventType, callback) => {
        const unsubscribe = slot.ad.addAdEventListener(eventType, callback);
        unsubscribeFns.push(unsubscribe);
        return unsubscribe;
    };

    try {
        addListener(AdEventType.OPENED, () => {
            safeLogAdEvent({ deviceId, adType: 'rewarded', placement, eventType: 'opened' });
        });
        addListener(AdEventType.CLOSED, () => {
            safeLogAdEvent({ deviceId, adType: 'rewarded', placement, eventType: 'closed' });
        });
        addListener(AdEventType.CLICKED, () => {
            safeLogAdEvent({ deviceId, adType: 'rewarded', placement, eventType: 'clicked' });
        });
        addListener(RewardedAdEventType.EARNED_REWARD, () => {
            rewardEarned = true;
            safeLogAdEvent({ deviceId, adType: 'rewarded', placement, eventType: 'reward_earned' });
        });

        const closePromise = new Promise((resolve, reject) => {
            const unsubscribeClosed = addListener(AdEventType.CLOSED, () => {
                unsubscribeClosed();
                unsubscribeError();
                resolve(true);
            });
            const unsubscribeError = addListener(AdEventType.ERROR, (error) => {
                unsubscribeClosed();
                unsubscribeError();
                reject(error);
            });
        });

        await safeLogAdEvent({ deviceId, adType: 'rewarded', placement, eventType: 'shown' });
        slot.ad.show();
        await withTimeout(closePromise, AD_SHOW_TIMEOUT_MS);

        return {
            shown: true,
            rewardEarned,
            reason: rewardEarned ? 'reward_earned' : 'closed_without_reward',
        };
    } catch (error) {
        lastErrorMessage = formatAdErrorMessage(error);
        await safeLogAdEvent({ deviceId, adType: 'rewarded', placement, eventType: 'error' });
        return {
            shown: false,
            rewardEarned: false,
            reason: 'load_or_show_failed',
            errorMessage: lastErrorMessage,
        };
    } finally {
        unsubscribeFns.forEach((fn) => {
            try { fn(); } catch (error) {}
        });
        slot.showInFlight = false;
        rebuildRewardedSlot(slot);
        queueRewardedPreload({ slot, deviceId });
    }
};

export const resetAdSessionState = () => {
    managerState.sessionStartedAt = Date.now();
    managerState.totalActions = 0;
    managerState.actionCounts = {};
    managerState.lastInterstitialAt = 0;
    managerState.interstitialsThisSession = 0;
    managerState.lastAppOpenAt = 0;
    managerState.appOpenThisSession = 0;
    managerState.appOpenInFlight = false;
    rewardedSlots.clear();
};
