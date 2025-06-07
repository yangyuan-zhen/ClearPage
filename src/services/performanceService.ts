/**
 * 性能监控服务
 * 处理网页性能数据的收集和分析
 */

export interface PerformanceMetrics {
    dnsTime: number;
    tcpTime: number;
    requestTime: number;
    responseTime: number;
    processingTime: number;
    loadTime: number;
    totalTime: number;
    resourceCount: number;
    resourceSize: number;
    javascriptTime?: number;
    renderTime?: number;
    paintTimes?: {
        firstPaint: number;
        firstContentfulPaint: number;
    };
    domStats?: {
        elements: number;
        depth: number;
    };
}

/**
 * 获取当前页面的性能指标
 * @param tabId 标签页ID
 * @returns 包含性能数据的Promise
 */
export async function getPagePerformanceMetrics(tabId: number): Promise<PerformanceMetrics | null> {
    try {
        // 向指定标签页发送消息请求性能数据
        const response = await sendMessageToTab(tabId, { action: "getPerformanceData" });

        if (!response || !response.success) {
            console.error("获取性能数据失败:", response?.error || "未知错误");
            return null;
        }

        return response.data;
    } catch (error) {
        console.error("获取性能数据时发生错误:", error);
        return null;
    }
}

/**
 * 向标签页发送消息并等待响应
 * @param tabId 标签页ID
 * @param message 要发送的消息
 * @returns 响应数据
 */
function sendMessageToTab(tabId: number, message: any): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            resolve(response);
        });
    });
}

/**
 * 计算性能改善建议
 * @param metrics 性能指标
 * @returns 建议数组
 */
export function analyzePerformance(metrics: PerformanceMetrics): string[] {
    const suggestions: string[] = [];

    // 分析DNS解析时间
    if (metrics.dnsTime > 100) {
        suggestions.push("DNS解析时间过长，建议使用DNS预解析或更换DNS服务");
    }

    // 分析请求响应时间
    if (metrics.responseTime > 500) {
        suggestions.push("服务器响应时间过长，可能需要服务端优化或使用CDN");
    }

    // 分析资源大小
    if (metrics.resourceSize > 5 * 1024 * 1024) { // 大于5MB
        suggestions.push("页面资源总大小较大，建议优化图片和其他资源");
    }

    // 分析资源数量
    if (metrics.resourceCount > 50) {
        suggestions.push("页面资源数量过多，建议合并资源或使用HTTP/2");
    }

    // 分析总加载时间
    if (metrics.totalTime > 3000) {
        suggestions.push("页面加载时间过长，建议使用懒加载和代码分割");
    }

    // 如果没有特别问题，添加一个正面的建议
    if (suggestions.length === 0) {
        suggestions.push("页面性能良好，无需特别优化");
    }

    return suggestions;
}

/**
 * 比较清理前后的性能变化
 * @param before 清理前的性能指标
 * @param after 清理后的性能指标
 * @returns 性能变化百分比和描述
 */
export function comparePerformance(before: PerformanceMetrics, after: PerformanceMetrics): {
    changes: { [key: string]: { value: number, percent: number } },
    summary: string
} {
    const changes: { [key: string]: { value: number, percent: number } } = {};

    // 计算关键指标的变化
    const calculateChange = (key: keyof PerformanceMetrics) => {
        if (typeof before[key] === 'number' && typeof after[key] === 'number') {
            const beforeVal = before[key] as number;
            const afterVal = after[key] as number;
            const diff = beforeVal - afterVal;
            const percent = beforeVal === 0 ? 0 : (diff / beforeVal) * 100;

            return {
                value: diff,
                percent: parseFloat(percent.toFixed(2))
            };
        }
        return { value: 0, percent: 0 };
    };

    // 计算关键性能指标的变化
    changes.totalTime = calculateChange('totalTime');
    changes.responseTime = calculateChange('responseTime');
    changes.resourceSize = calculateChange('resourceSize');

    // 生成摘要
    let summary = "";

    if (changes.totalTime.percent > 0) {
        summary = `清理后页面加载速度提升了${changes.totalTime.percent.toFixed(1)}%`;
    } else {
        summary = `清理可能没有明显改善页面性能，建议尝试其他优化方法`;
    }

    return { changes, summary };
} 