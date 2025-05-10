import { clearDomainCache } from '../cacheUtils';

// 模拟chrome API
if (!global.chrome) {
    global.chrome = {
        runtime: {
            sendMessage: jest.fn(),
        }
    } as unknown as typeof chrome;
}

// 设置固定的Date.now()值，使测试更可预测
const fixedTime = 1746890240151;
const realDateNow = Date.now;

describe('cacheUtils', () => {
    beforeEach(() => {
        // Mock Date.now
        Date.now = jest.fn(() => fixedTime);
        (chrome.runtime.sendMessage as jest.Mock).mockReset();
    });

    afterAll(() => {
        // 恢复真实的Date.now
        Date.now = realDateNow;
    });

    it('成功清除缓存', async () => {
        (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({ success: true });

        const result = await clearDomainCache({
            domain: 'example.com',
            dataTypes: ['cache']
        });

        expect(result.success).toBe(true);
        expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
            type: 'CLEAR_CACHE',
            payload: {
                domain: 'example.com',
                dataTypes: ['cache'],
                since: 0  // 应该是0，表示清除所有缓存
            }
        });
    });

    it('处理清除缓存失败', async () => {
        const errorMessage = '测试错误';
        (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
            success: false,
            error: errorMessage
        });

        const result = await clearDomainCache({
            domain: 'example.com'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe(errorMessage);
    });

    it('处理异常情况', async () => {
        (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue(
            new Error('网络错误')
        );

        const result = await clearDomainCache({
            domain: 'example.com'
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe('网络错误');
    });
}); 