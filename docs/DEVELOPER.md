# ClearPage 开发者文档

## 项目概述

ClearPage 是一个用于清理浏览器缓存和监测网页性能的 Chrome 扩展程序。项目使用 TypeScript 开发，采用 React 作为 UI 库，结合 Tailwind CSS 进行样式设计。

**当前版本**: 1.0.9

## 项目结构

```
ClearPage/
├── src/                      # 源代码目录
│   ├── components/           # React组件
│   │   ├── performance/      # 性能相关组件
│   │   ├── CacheClearButton.tsx
│   │   ├── PerformancePanel.tsx
│   │   └── SettingsPanel.tsx
│   ├── contexts/             # React上下文
│   ├── utils/                # 工具函数
│   │   ├── __tests__/        # 单元测试
│   │   ├── formatUtils.ts    # 格式化工具
│   │   ├── i18n.ts           # 国际化工具
│   │   └── performanceUtils.ts # 性能分析工具
│   ├── types/                # TypeScript类型定义
│   ├── background.ts         # 扩展后台脚本
│   ├── content.ts            # 内容脚本
│   ├── options.tsx           # 选项页面
│   └── popup.tsx             # 弹出窗口
├── public/                   # 静态资源
├── webpack/                  # webpack配置
├── jest.config.js            # Jest测试配置
├── package.json              # 项目依赖
└── tsconfig.json             # TypeScript配置
```

## 开发环境设置

### 前提条件

- Node.js (v14+)
- npm 或 yarn
- Chrome 浏览器

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
```

此命令将启动 webpack 开发服务器，并监视文件变更以实时重新编译。

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建完成后，扩展文件将输出到`dist/`目录。

### 测试

```bash
npm run test
# 或
yarn test
```

## 关键模块说明

### 缓存清理模块

缓存清理功能主要通过 Chrome 的`chrome.browsingData` API 实现，可以清理不同类型的浏览数据。

主要文件:

- `src/components/CacheClearButton.tsx`: 清理按钮 UI 和交互逻辑
- `src/background.ts`: 处理后台缓存清理操作

### 性能分析模块

性能分析功能通过注入内容脚本收集页面性能数据，使用 Web Performance API 获取各项指标。

主要文件:

- `src/components/PerformancePanel.tsx`: 性能面板 UI
- `src/components/performance/`: 各类性能可视化组件
- `src/utils/performanceUtils.ts`: 性能数据收集和处理逻辑

### 设置管理模块

设置模块允许用户创建和管理自定义清理规则，使用 Chrome Storage API 保存数据。

主要文件:

- `src/components/SettingsPanel.tsx`: 设置面板 UI 和规则管理逻辑

### 国际化模块

项目支持中英文双语，使用自定义的轻量级 i18n 解决方案。

主要文件:

- `src/utils/i18n.ts`: 国际化工具函数
- `src/contexts/LanguageContext.tsx`: 语言上下文管理

## 编码规范

### TypeScript

- 使用严格模式 (`"strict": true`)
- 所有函数和组件都应有明确的类型定义
- 使用接口定义组件 props
- 避免使用`any`类型

### React

- 使用函数式组件和 Hooks
- 优先使用受控组件处理表单
- 使用`useCallback`和`useMemo`优化性能
- 在大型组件中拆分逻辑和 UI

### 样式

- 使用 Tailwind CSS 实现页面样式
- 遵循一致的样式命名和组织
- 响应式设计，确保在不同尺寸下都有良好表现

### 测试

- 使用 Jest 和 React Testing Library 进行测试
- 关键功能应有单元测试覆盖
- 模拟浏览器 API 以测试扩展特定功能

## 版本发布流程

1. 更新`package.json`和相关文档中的版本号
2. 确保所有测试通过
3. 构建生产版本
4. 将`dist/`目录打包成 zip 文件
5. 在 Chrome 扩展商店开发者后台上传新版本
6. 填写更新日志
7. 提交审核

## 浏览器 API 使用

### chrome.browsingData

用于清除不同类型的浏览数据，如缓存、cookie、本地存储等。

```typescript
chrome.browsingData.remove(
  {
    origins: ["https://example.com"],
  },
  {
    cache: true,
    cookies: true,
    localStorage: true,
  }
);
```

### chrome.tabs

用于与浏览器标签页交互，获取当前标签信息，执行脚本等。

```typescript
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.tabs.executeScript(tabs[0].id, {
    code: 'document.body.style.backgroundColor = "red"',
  });
});
```

### chrome.storage

用于存储和检索扩展数据，如用户设置、清理规则等。

```typescript
// 保存数据
chrome.storage.sync.set({ key: value }, function () {
  console.log("数据已保存");
});

// 读取数据
chrome.storage.sync.get(["key"], function (result) {
  console.log("Value currently is " + result.key);
});
```

## 常见问题

### Q: 如何调试内容脚本?

A: 在 Chrome 开发者工具中的"源代码"面板下，展开"内容脚本"部分，可以找到注入到页面的脚本文件进行调试。

### Q: 如何模拟特定浏览器环境进行测试?

A: 使用 Jest 的 mock 功能模拟 Chrome API:

```typescript
// 在测试文件中
global.chrome = {
  browsingData: {
    remove: jest.fn(() => Promise.resolve()),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
};
```

### Q: 如何处理跨域限制问题?

A: 确保在`manifest.json`中为必要的 API 添加适当的权限，如：

```json
"permissions": [
  "browsingData",
  "storage",
  "tabs",
  "http://*/*",
  "https://*/*"
]
```

## 贡献指南

1. Fork 项目仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 联系与支持

如有开发相关问题，请联系项目维护者:

- 邮箱: yhrsc30@gmail.com
