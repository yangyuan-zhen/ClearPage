# 网页数据清理插件

中文 | [English](./README_EN.md)

一个简单高效的浏览器扩展，帮助用户快速清理特定网站的缓存、Cookie 等浏览数据。

## ✨ 主要功能

- 🎯 精确清理当前网站的缓存数据
- 🔄 清理后自动刷新页面
- ⚠️ 敏感数据清理前有安全提示
- 💡 清理建议与一键应用推荐
- 📊 网页性能检测功能
- 🌐 支持中英文国际化
- 🎨 简洁美观的操作界面

## 🔧 支持清理的数据类型

- 网站缓存
- Cookie 数据
- 本地存储
- Service Worker

## 📊 性能检测指标

- DNS 解析时间
- TCP 连接时间
- 请求响应时间
- DOM 解析时间
- 页面加载总时间
- 资源数量及大小

## 📦 安装方法

1. 克隆项目
   git clone
   cd ClearPage

2. 安装依赖
   npm install
3. 构建项目
   npm run build

4. 在浏览器中安装

- 打开浏览器扩展管理页面
- 开启"开发者模式"
- 点击"加载已解压的扩展程序"
- 选择项目的 `dist` 目录

## 💡 使用说明

1. 点击插件图标打开操作面板
2. 查看清理建议并可一键应用推荐
3. 勾选需要清理的数据类型
4. 点击"清除数据"按钮
5. 如涉及 Cookie 等敏感数据会有警告提示
6. 确认后自动清理并刷新页面

## 🔨 开发相关

### 技术栈

- TypeScript + React
- Tailwind CSS
- 浏览器扩展 API

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

## 📅 更新日志

### 2025-04-17

- 💡 新增清理建议与一键应用推荐功能

### 2025-04-04

- ✨ 新增清除数据耗时显示功能
- 🚀 优化缓存清理性能，提高清除速度

### 2025-02-03

- ✨ 新增清除单个网站域名的历史记录功能

### 2025-01-13

- ✨ 新增浏览器 i18n 国际化语言支持

### 2025-01-12

- ✨ 新增页面性能检测工具
- 🐛 修复清理 Service Worker 后无法刷新的问题

## ⭐ Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=yangyuan-zhen/ClearPage&type=Date)](https://star-history.com/#yangyuan-zhen/ClearPage&Date)
