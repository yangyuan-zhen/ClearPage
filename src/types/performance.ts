/**
 * 页面性能数据接口
 */
export interface PagePerformance {
    // 基础性能指标
    score: number;            // 总体性能评分 (0-100)
    timing: number;           // 页面加载时间 (毫秒)
    resourceCount: number;    // 资源数量
    resourceSize: number;     // 资源总大小 (字节)

    // 资源类型分布
    resourceTypes: {
        js: number;             // JavaScript文件数量
        css: number;            // CSS文件数量
        image: number;          // 图片数量
        font: number;           // 字体数量
        other: number;          // 其他资源数量
    };

    // 资源大小分布
    jsSize: number;           // JavaScript总大小 (字节)
    cssSize: number;          // CSS总大小 (字节)
    imageSize: number;        // 图片总大小 (字节)

    // 关键时间点指标 (毫秒)
    firstPaint: number;              // 首次绘制时间
    firstContentfulPaint: number;    // 首次内容绘制时间
    domInteractive: number;          // DOM可交互时间
    domComplete: number;             // DOM完成时间

    // 执行指标
    jsExecutionTime: number;         // JavaScript执行时间 (毫秒)
    cssParsingTime: number;          // CSS解析时间 (毫秒)

    // 缓存和内存统计
    cacheHitRate: number;            // 缓存命中率 (百分比)
    memoryUsage: number;             // 内存使用量 (MB)

    // DOM统计
    domElements: number;             // DOM元素数量
}

/**
 * 资源类型枚举
 */
export enum ResourceType {
    JS = 'js',
    CSS = 'css',
    Image = 'image',
    Font = 'font',
    Other = 'other'
} 