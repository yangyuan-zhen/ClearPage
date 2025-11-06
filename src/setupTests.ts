import '@testing-library/jest-dom';

// Mock chrome API
(globalThis as any).chrome = {
    runtime: {
        onInstalled: {
            addListener: jest.fn(),
        },
        onMessage: {
            addListener: jest.fn(),
        },
        sendMessage: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
    },
    tabs: {
        query: jest.fn().mockImplementation(() =>
            Promise.resolve([{ url: 'https://example.com/page' }])
        ),
    },
    browsingData: {
        remove: jest.fn().mockImplementation(() => Promise.resolve()),
    },
    storage: {
        sync: {
            get: jest.fn().mockImplementation(() => Promise.resolve({})),
            set: jest.fn().mockImplementation(() => Promise.resolve()),
        },
    },
};

// 清除所有 mock 的实现
beforeEach(() => {
    jest.clearAllMocks();
});

// 消除 React 18 相关的警告
jest.mock('react-dom', () => {
    const original = jest.requireActual('react-dom');
    return {
        ...original,
        createRoot: jest.fn().mockImplementation((container) => ({
            render: jest.fn(),
            unmount: jest.fn(),
        })),
    };
});

// 消除 act 警告
jest.mock('react', () => {
    const originalReact = jest.requireActual('react');
    return {
        ...originalReact,
        useEffect: jest.fn().mockImplementation((f) => f()),
    };
}); 