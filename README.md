# 网页缓存清理插件

一个简单高效的 Chrome 扩展，帮助用户快速清理特定网站的缓存、Cookie 等浏览数据。

## ✨ 主要功能

- 🎯 精确清理当前网站的缓存数据
- 🔄 清理后自动刷新页面
- ⚠️ 敏感数据清理前有安全提示
- 🎨 简洁美观的操作界面

## 🔧 支持清理的数据类型

- 网站缓存
- Cookie 数据
- 本地存储
- Service Worker

## 📦 安装方法

1. 克隆项目
   git clone [项目地址]
   cd ClearPage

2. 安装依赖
   npm install
3. 构建项目
   npm run build

4. 在 Chrome 中安装

- 打开 Chrome 扩展管理页面 (`chrome://extensions/`)
- 开启"开发者模式"
- 点击"加载已解压的扩展程序"
- 选择项目的 `dist` 目录

## 💡 使用说明

1. 点击插件图标打开操作面板
2. 勾选需要清理的数据类型
3. 点击"清除数据"按钮
4. 如涉及 Cookie 等敏感数据会有警告提示
5. 确认后自动清理并刷新页面

## 🔨 开发相关

### 技术栈

- TypeScript + React
- Tailwind CSS
- Chrome Extension API

### 开发命令

开发模式
npm start
构建
npm run build
测试
npm test

## ⚠️ 注意事项

- 清除 Cookie 会导致网站登录状态丢失
- 插件仅对当前打开的网站生效
- 建议在使用前确认要清理的数据类型

## 📝 许可证

MIT License
