import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
    AdEventType,
    BannerAd,
    BannerAdSize,
    TestIds,
} from 'react-native-google-mobile-ads';
import api from '../services/api';
import { getPlacementUnitId, isPlacementEnabled } from '../services/monetization';

const safeLogAdEvent = async ({ deviceId, eventType, placement }) => {
    if (!deviceId) return;
    try {
        await api.logAdEvent({
            deviceHash: deviceId,
            eventType,
            adType: 'banner',
            placement,
        });
    } catch (error) {
        // Keep UI resilient even when telemetry is unavailable.
    }
};

const ManagedBannerAd = ({
    config,
    placement,
    deviceId,
    size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
    style,
}) => {
    const enabled = useMemo(
        () => isPlacementEnabled(config, placement),
        [config, placement],
    );
    const unitId = useMemo(() => {
        const placementId = getPlacementUnitId(config, placement);
        if (!placementId) return TestIds.BANNER;
        return placementId;
    }, [config, placement]);

    if (!enabled) return null;

    return (
        <View style={[styles.container, style]}>
            <BannerAd
                unitId={unitId}
                size={size}
                requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                onAdLoaded={() => safeLogAdEvent({ deviceId, placement, eventType: 'loaded' })}
                onAdOpened={() => safeLogAdEvent({ deviceId, placement, eventType: 'opened' })}
                onAdClosed={() => safeLogAdEvent({ deviceId, placement, eventType: 'closed' })}
                onAdFailedToLoad={() => safeLogAdEvent({ deviceId, placement, eventType: 'error' })}
                onPaid={() => safeLogAdEvent({ deviceId, placement, eventType: 'paid' })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Platform.select({ ios: 8, android: 6 }),
    },
});

export default ManagedBannerAd;
