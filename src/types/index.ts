/**
 * 可清理的数据类型
 */
export type DataType =
    | "cache"
    | "cookies"
    | "localStorage"
    | "sessionStorage"
    | "indexedDB"
    | "webSQL"
    | "fileSystem"
    | "formData"
    | "serviceWorkers";

/**
 * 通知类型
 */
export type NotificationType = "success" | "error" | "info"; 