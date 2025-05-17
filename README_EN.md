# Web Data Cleaner

[中文](./README.md) | English

A simple and efficient browser extension that helps users quickly clean cache, cookies and other browsing data for specific websites.

## ✨ Key Features

- 🎯 Precisely clean cache data for current website
- 🔄 Automatically refresh page after cleaning
- ⚠️ Security prompts before clearing sensitive data
- 💡 Smart cleaning recommendations with auto-apply
- 📊 Automatic website performance detection
- 🌐 Multilingual support (English/Chinese)
- 🎨 Clean and intuitive user interface
- 📱 Optimized layout design for better visual experience
- ⏱️ Custom cleaning rules and scheduled cleaning

## 📸 Product Screenshot

![Product Screenshot](public/2.png)

## 🔧 Data Types Supported

- Website cache
- Cookies
- Local storage
- Service workers
- IndexedDB databases
- SessionStorage
- WebSQL databases
- Form data
- File system storage

## 📊 Performance Metrics

- DNS lookup time
- TCP connection time
- Request/response time
- DOM parsing time
- Total page load time
- Resource count and size

## 📦 Installation

1. Clone the repository
   git clone
   cd ClearPage

2. Install dependencies
   npm install

3. Build the project
   npm run build

4. Install in your browser

- Open browser extensions management page
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` directory

## 💡 How to Use

1. Click the extension icon to open the panel
2. Smart cleaning recommendations are automatically applied
3. Use the select/deselect all buttons to quickly manage data types
4. Click the "Clear Data" button
5. Confirm the warning prompt for sensitive data (like cookies)
6. The page will automatically refresh after cleaning
7. Switch to "Performance" tab to view automatically executed performance analysis
8. Create and manage custom cleaning rules in the "Settings" tab

## 🔨 Development

### Tech Stack

- TypeScript + React
- Tailwind CSS
- Browser Extension API

### Commands

Development mode
npm start
Build
npm run build
Test
npm test

## ⚠️ Important Notes

- Clearing cookies will log you out of websites
- The extension only affects the currently open website
- Always verify which data types you're clearing before proceeding

## 📝 License

MIT License

## 📅 Change Log

### 2025-05-10

- ✨ Implemented automatic performance detection when switching to performance tab
- 🚀 Optimized smart recommendations to auto-apply when opening the extension
- 📋 Added select/deselect all functionality for data types

### 2025-05-03

- ✨ Added custom cleaning rules feature for creating and managing rules
- 🚀 Implemented scheduled automatic cleaning with daily, weekly, monthly options
- 🔄 Optimized interface navigation with tab-based switching

### 2025-04-25

- 🎨 Optimized interface layout, increased width, and improved usability
- ✨ Improved data type display with grouping and multi-column layout
- 🚀 Enhanced buttons and interactive elements with better visual feedback

### 2025-04-22

- ✨ Added support for more data types: IndexedDB, SessionStorage, WebSQL, etc.
- 🚀 Implemented deep cleaning mode for more thorough website data removal

### 2025-04-17

- 💡 Added cleaning recommendations and one-click apply feature

### 2025-04-04

- ✨ Added display of data clearing time
- 🚀 Optimized cache clearing performance for faster operation

### 2025-02-03

- ✨ Added feature to clear browsing history for specific domains

### 2025-01-13

- ✨ Added browser i18n internationalization support

### 2025-01-12

- ✨ Added page performance detection tool
- 🐛 Fixed refresh issue after clearing Service Workers

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/yangyuan-zhen/ClearPage)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yangyuan-zhen/ClearPage&type=Date)](https://star-history.com/#yangyuan-zhen/ClearPage&Date)
