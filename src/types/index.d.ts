export type DataType =
    | 'cache'
    | 'cookies'
    | 'downloads'
    | 'fileSystems'
    | 'formData'
    | 'history'
    | 'indexedDB'
    | 'localStorage'
    | 'passwords'
    | 'serviceWorkers'
    | 'webSQL';

export type TimeRange = 'hour' | 'day' | 'week' | 'month' | 'all';

export interface CacheOptions {
    domain?: string;
    since?: number;
    dataTypes?: DataType[];
    timeRange?: TimeRange;
}

export interface ClearCacheResult {
    success: boolean;
    error?: string;
} 