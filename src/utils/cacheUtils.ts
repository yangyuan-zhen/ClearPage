import { CacheOptions, ClearCacheResult } from '../types';

/**
 * 清除指定域名的浏览器缓存
 * @param options - 缓存清理选项
 * @param options.domain - 要清除缓存的域名
 * @param options.since - 清除此时间点之后的缓存（时间戳）
 * @param options.dataTypes - 要清除的数据类型
 * @returns Promise<ClearCacheResult> - 清除结果
 */
export const clearDomainCache = async (
    options: CacheOptions = {}
): Promise<ClearCacheResult> => {
    try {
        const { domain, since = Date.now() - 3600000, dataTypes = ['cache'] } = options;

        // 默认只清理最近一小时的数据，而不是全部历史
        // 这样可以显著提高大型网站的清理速度

        // 发送消息给 background script
        const response = await chrome.runtime.sendMessage({
            type: 'CLEAR_CACHE',
            payload: {
                domain,
                since,
                dataTypes
            }
        });

        if (response.success) {
            return { success: true };
        } else {
            return {
                success: false,
                error: response.error || '清除失败'
            };
        }
    } catch (error) {
        console.error('清除缓存失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        };
    }
}; 