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

export interface CacheOptions {
    domain?: string;
    since?: number;
    dataTypes?: DataType[];
}

export interface ClearCacheResult {
    success: boolean;
    error?: string;
} 