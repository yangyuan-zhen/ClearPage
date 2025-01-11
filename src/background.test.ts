import { waitFor } from '@testing-library/react';
import '../background';

describe('Background Script', () => {
    let messageListener: Function;

    beforeEach(() => {
        messageListener = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0][0];
        (chrome.browsingData.remove as jest.Mock).mockReset();
    });

    it('处理清除缓存消息', async () => {
        const sendResponse = jest.fn();
        (chrome.browsingData.remove as jest.Mock).mockResolvedValue(undefined);

        messageListener(
            {
                type: 'CLEAR_CACHE',
                payload: {
                    domain: 'example.com',
                    dataTypes: ['cache'],
                    since: 0
                }
            },
            {},
            sendResponse
        );

        await waitFor(() => {
            expect(chrome.browsingData.remove).toHaveBeenCalled();
            expect(sendResponse).toHaveBeenCalledWith({ success: true });
        });
    });
}); 