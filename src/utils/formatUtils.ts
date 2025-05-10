/**
 * 将字节大小转换为人类可读的格式
 * @param bytes 字节数
 * @returns 格式化后的字符串，如 1.5KB, 4.2MB 等
 */
export function bytesToSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化数字，保留指定小数位
 * @param num 要格式化的数字
 * @param digits 小数位数，默认为2
 * @returns 格式化后的数字
 */
export function formatNumber(num: number, digits: number = 2): number {
    return parseFloat(num.toFixed(digits));
}

/**
 * 将毫秒时间格式化为易读格式
 * @param ms 毫秒时间
 * @returns 格式化后的时间字符串
 */
export function formatTimeInMs(ms: number): string {
    if (ms < 1) return '0 ms';

    if (ms < 1000) {
        return `${Math.round(ms)} ms`;
    } else {
        return `${(ms / 1000).toFixed(2)} s`;
    }
}

/**
 * 格式化日期时间
 * @param date 日期对象或时间戳
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: Date | number): string {
    const d = typeof date === 'number' ? new Date(date) : date;

    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
} 