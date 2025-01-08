import { clearDomainCache } from '../cacheUtils';

describe('cacheUtils', () => {
    beforeEach(() => {
        (chrome.runtime.sendMessage as jest.Mock).mockReset();
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
                since: 0
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