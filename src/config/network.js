import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOCAL_API_PORT = '3001';
const DEFAULT_PRODUCTION_API_BASE_URL = 'https://quotiva-theta.vercel.app/api';

const stripTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const getExpoHost = () => {
    const hostUri =
        Constants?.expoConfig?.hostUri ||
        Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
        Constants?.manifest?.debuggerHost ||
        '';

    if (!hostUri) return '';
    return hostUri.split(':')[0];
};

const resolveDevHost = () => {
    if (Platform.OS === 'android') {
        return process.env.EXPO_PUBLIC_ANDROID_DEV_API_HOST || '10.0.2.2';
    }

    const host = getExpoHost();
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
    }

    return 'localhost';
};

const getDefaultApiBaseUrl = () => {
    // if (__DEV__) {
    //     return `http://${resolveDevHost()}:${LOCAL_API_PORT}/api`;
    // }
    return DEFAULT_PRODUCTION_API_BASE_URL;
};

export const API_BASE_URL = stripTrailingSlash(
    process.env.EXPO_PUBLIC_API_BASE_URL || getDefaultApiBaseUrl(),
);

export const IMAGE_BASE_URL = stripTrailingSlash(
    process.env.EXPO_PUBLIC_IMAGE_BASE_URL || `${API_BASE_URL.replace(/\/api$/, '')}/images`,
);
