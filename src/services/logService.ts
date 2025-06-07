/**
 * 日志服务
 * 提供统一的日志记录和错误处理功能
 */

// 日志级别
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

// 当前日志级别配置
let currentLogLevel = LogLevel.INFO;

// 是否启用控制台输出
let consoleOutputEnabled = true;

// 错误处理函数类型
type ErrorHandler = (error: Error | string, context?: any) => void;

// 自定义错误处理器
let customErrorHandler: ErrorHandler | null = null;

/**
 * 配置日志服务
 * @param options 配置选项
 */
export function configureLogger({
    logLevel = LogLevel.INFO,
    enableConsole = true,
    errorHandler = null
}: {
    logLevel?: LogLevel,
    enableConsole?: boolean,
    errorHandler?: ErrorHandler | null
} = {}) {
    currentLogLevel = logLevel;
    consoleOutputEnabled = enableConsole;
    customErrorHandler = errorHandler;
}

/**
 * 记录调试级别日志
 * @param message 日志消息
 * @param data 相关数据
 */
export function debug(message: string, data?: any): void {
    logMessage(LogLevel.DEBUG, message, data);
}

/**
 * 记录信息级别日志
 * @param message 日志消息
 * @param data 相关数据
 */
export function info(message: string, data?: any): void {
    logMessage(LogLevel.INFO, message, data);
}

/**
 * 记录警告级别日志
 * @param message 日志消息
 * @param data 相关数据
 */
export function warn(message: string, data?: any): void {
    logMessage(LogLevel.WARN, message, data);
}

/**
 * 记录错误级别日志
 * @param message 错误消息
 * @param error 错误对象
 */
export function error(message: string, error?: any): void {
    logMessage(LogLevel.ERROR, message, error);

    // 处理错误
    handleError(message, error);
}

/**
 * 记录页面刷新事件
 * @param domain 刷新的域名
 * @param count 刷新的标签页数量
 */
export function logPageRefresh(domain: string, count: number): void {
    const message = count > 0
        ? `已刷新 ${count} 个与域名 "${domain}" 匹配的标签页`
        : `没有找到与域名 "${domain}" 匹配的标签页`;

    info(message, { domain, refreshedCount: count });
}

/**
 * 内部使用的日志记录函数
 * @param level 日志级别
 * @param message 日志消息
 * @param data 相关数据
 */
function logMessage(level: LogLevel, message: string, data?: any): void {
    // 检查日志级别
    if (level < currentLogLevel) {
        return;
    }

    // 获取级别对应的标签
    const levelTag = getLevelTag(level);

    // 获取时间戳
    const timestamp = new Date().toISOString();

    // 构建日志记录
    const logEntry = {
        timestamp,
        level: LogLevel[level],
        message,
        data: data !== undefined ? data : null
    };

    // 输出到控制台
    if (consoleOutputEnabled) {
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(`${levelTag} ${message}`, data !== undefined ? data : '');
                break;
            case LogLevel.INFO:
                console.info(`${levelTag} ${message}`, data !== undefined ? data : '');
                break;
            case LogLevel.WARN:
                console.warn(`${levelTag} ${message}`, data !== undefined ? data : '');
                break;
            case LogLevel.ERROR:
                console.error(`${levelTag} ${message}`, data !== undefined ? data : '');
                break;
        }
    }

    // 在这里可以添加保存日志到存储的逻辑
    // 例如：保存到chrome.storage或发送到远程服务器
}

/**
 * 获取日志级别对应的标签
 * @param level 日志级别
 * @returns 格式化的标签
 */
function getLevelTag(level: LogLevel): string {
    switch (level) {
        case LogLevel.DEBUG:
            return '[DEBUG]';
        case LogLevel.INFO:
            return '[INFO]';
        case LogLevel.WARN:
            return '[WARN]';
        case LogLevel.ERROR:
            return '[ERROR]';
        default:
            return '[UNKNOWN]';
    }
}

/**
 * 处理错误
 * @param message 错误消息
 * @param error 错误对象
 */
function handleError(message: string, error?: any): void {
    // 提取错误详情
    let errorDetails: Error;

    if (error instanceof Error) {
        errorDetails = error;
    } else if (typeof error === 'string') {
        errorDetails = new Error(error);
    } else if (error !== undefined) {
        try {
            errorDetails = new Error(JSON.stringify(error));
        } catch {
            errorDetails = new Error('无法序列化的错误数据');
        }
    } else {
        errorDetails = new Error(message);
    }

    // 如果有自定义错误处理器，调用它
    if (customErrorHandler) {
        try {
            customErrorHandler(errorDetails, { message });
        } catch (handlerError) {
            console.error('错误处理器执行失败:', handlerError);
        }
    }

    // 这里可以添加错误报告逻辑，如发送到分析服务
}

/**
 * 计时器工具，用于性能分析
 */
export class Timer {
    private startTime: number;
    private name: string;

    /**
     * 创建一个计时器
     * @param name 计时器名称
     */
    constructor(name: string = 'Default Timer') {
        this.name = name;
        this.startTime = performance.now();
        debug(`计时开始: ${name}`);
    }

    /**
     * 停止计时并返回经过的时间（毫秒）
     * @param logResult 是否记录结果
     * @returns 经过的时间（毫秒）
     */
    stop(logResult: boolean = true): number {
        const endTime = performance.now();
        const elapsed = endTime - this.startTime;

        if (logResult) {
            info(`计时结束: ${this.name} - 耗时 ${elapsed.toFixed(2)}ms`);
        }

        return elapsed;
    }
} 