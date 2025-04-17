# Web Data Cleaner

[中文](./README.md) | English

A simple and efficient browser extension that helps users quickly clean cache, cookies and other browsing data for specific websites.

## ✨ Key Features

- 🎯 Precisely clean cache data for current website
- 🔄 Automatically refresh page after cleaning
- ⚠️ Security prompts before clearing sensitive data
- 💡 Cleaning recommendations and one-click apply
- 📊 Website performance detection
- 🌐 Multilingual support (English/Chinese)
- 🎨 Clean and intuitive user interface

## 🔧 Data Types Supported

- Website cache
- Cookies
- Local storage
- Service workers

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
2. View cleaning recommendations and apply with one click
3. Select the data types you want to clear
4. Click the "Clear Data" button
5. Confirm the warning prompt for sensitive data (like cookies)
6. The page will automatically refresh after cleaning

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

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yangyuan-zhen/ClearPage&type=Date)](https://star-history.com/#yangyuan-zhen/ClearPage&Date)
