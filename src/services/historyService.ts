import type { DataType } from "../types";

interface CleanHistory {
    domain: string;
    dataTypes: DataType[];
    timestamp: number;
}

/**
 * 清理历史记录服务
 */
export class CleanHistoryService {
    private readonly STORAGE_KEY = 'clean_history';
    private readonly MAX_HISTORY = 50; // 最多保存50条历史记录

    /**
     * 保存清理记录
     */
    async saveCleanHistory(domain: string, dataTypes: DataType[]): Promise<void> {
        try {
            const history = await this.getCleanHistory();

            // 添加新记录
            history.unshift({
                domain,
                dataTypes,
                timestamp: Date.now()
            });

            // 限制历史记录数量
            if (history.length > this.MAX_HISTORY) {
                history.length = this.MAX_HISTORY;
            }

            // 保存到存储
            await chrome.storage.local.set({ [this.STORAGE_KEY]: history });
        } catch (error) {
            console.error('保存清理历史失败:', error);
        }
    }

    /**
     * 获取清理历史
     */
    async getCleanHistory(): Promise<CleanHistory[]> {
        try {
            const result = await chrome.storage.local.get(this.STORAGE_KEY);
            return result[this.STORAGE_KEY] || [];
        } catch (error) {
            console.error('获取清理历史失败:', error);
            return [];
        }
    }

    /**
     * 获取特定域名的历史
     */
    async getDomainHistory(domain: string): Promise<CleanHistory[]> {
        const history = await this.getCleanHistory();
        return history.filter(item => item.domain === domain);
    }

    /**
     * 获取最常用的清理类型
     */
    async getMostUsedDataTypes(): Promise<DataType[]> {
        const history = await this.getCleanHistory();

        // 统计各数据类型的使用频率
        const typeCounts: Record<string, number> = {};

        history.forEach(item => {
            item.dataTypes.forEach(type => {
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });
        });

        // 按使用频率排序
        return Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type]) => type as DataType);
    }
}

export const cleanHistoryService = new CleanHistoryService(); 