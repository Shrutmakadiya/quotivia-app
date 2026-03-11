import { useCallback, useEffect, useState } from 'react';
import {
    fetchMonetizationConfig,
    getDefaultMonetizationConfig,
    isPlacementEnabled,
    getPlacementConfig,
} from '../services/monetization';

export const useMonetization = (deviceId) => {
    const [config, setConfig] = useState(getDefaultMonetizationConfig());
    const [isLoading, setIsLoading] = useState(true);

    const refreshConfig = useCallback(async (force = false) => {
        try {
            const nextConfig = await fetchMonetizationConfig({ deviceId, force });
            setConfig(nextConfig);
        } finally {
            setIsLoading(false);
        }
    }, [deviceId]);

    useEffect(() => {
        refreshConfig(false);
    }, [refreshConfig]);

    return {
        config,
        isLoading,
        refreshConfig,
        isPlacementEnabled: (placementName) => isPlacementEnabled(config, placementName),
        getPlacementConfig: (placementName) => getPlacementConfig(config, placementName),
    };
};

export default useMonetization;
