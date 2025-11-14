/**
 * 服务模块导出文件
 * 统一导出所有服务，便于引用
 */

// 导出数据清理服务
export * from './dataClearingService';

// 导出性能监控服务
export * from './performanceService';

// 导出日志服务
export * from './logService';


/**
 * 服务初始化函数
 * 用于在应用启动时初始化所有服务
 */
export function initializeServices(): void {
    // 此处可以添加各种服务的初始化逻辑
    // 例如配置日志服务、初始化数据存储等

    console.log('所有服务已初始化');
}

/**
 * 服务清理函数
 * 用于在应用关闭时清理资源
 */
export function cleanupServices(): void {
    // 此处可以添加各种服务的清理逻辑

    console.log('所有服务已清理');
}