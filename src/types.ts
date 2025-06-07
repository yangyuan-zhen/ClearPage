export type DataType =
    | "cache"
    | "cookies"
    | "localStorage"
    | "serviceWorkers"
    | "indexedDB"
    | "sessionStorage"
    | "webSQL"
    | "formData"
    | "fileSystem";

export interface CacheOptions {
    domain?: string;
    since?: number;
    dataTypes?: DataType[];
    autoRefresh?: boolean;
}

export interface ClearCacheResult {
    success: boolean;
    error?: string;
    timeUsed?: number;
    refreshed?: boolean;
    refreshedCount?: number;
}