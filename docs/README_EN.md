# ClearPage Browser Extension

## Project Overview

ClearPage is a powerful browser extension designed to enhance your web browsing experience. By intelligently clearing website cache data and monitoring webpage performance, ClearPage helps keep your browser running efficiently while providing detailed performance analytics to understand website loading behavior.

**Current Version**: 1.0.9

## Key Features

### 1. Smart Cache Cleaning

- **Intelligent Recommendations**: Automatically suggests the most appropriate data types to clear based on website characteristics
- **One-Click Cleaning**: Simple click to clear selected cache and storage data
- **Customization Options**: Choose which data types to clear, including cache, cookies, localStorage, and more
- **Site-Specific Rules**: Set different cleaning rules for different websites

### 2. Advanced Performance Analysis

- **Performance Scoring**: Comprehensive performance evaluation with intuitive scoring
- **Resource Analysis**: Displays page resource distribution, including JS, CSS, images, and more
- **Load Time Analysis**: Monitors key performance metrics such as first paint, DOM interactive time, etc.
- **Visual Charts**: Uses charts to visually represent resource distribution and size proportions

### 3. Custom Settings

- **Cleaning Rules**: Create and manage custom cleaning rules for specific websites
- **Import/Export**: Support for exporting settings for backup or importing existing configurations
- **Multilingual Support**: Full support for Chinese and English interfaces

## User Guide

### Smart Cleaning

1. Click the extension icon to open ClearPage
2. Select the "Clean Data" tab
3. Use "Smart Cleaning" mode to get recommendations for the current website
4. Click "Apply Suggestions" to use the recommended data types, or adjust selections manually
5. Click the "Smart Clean" button to start the cleaning process

### Performance Detection

1. Open the webpage you want to analyze
2. Click the extension icon and select the "Performance Detection" tab
3. Wait for the performance data to load
4. Review performance scores, resource analysis, and load time metrics
5. Use charts to visually understand resource distribution

### Setting Rules

1. Go to the "Settings" tab
2. Click "Add Rule" to create a new cleaning rule
3. Enter a rule name and domain(s) to which it applies (can use wildcards and comma separation)
4. Select which data types to clear under this rule
5. Click "Save" to complete rule creation

## Data Types Explained

- **Cache**: Temporary storage of website images, scripts, and other media files
- **Cookies**: Website saved login states, preferences, and other information
- **Local Storage**: Persistent data stored by websites in your browser
- **Session Storage**: Temporary data stored by websites during the current session
- **IndexedDB**: Structured data stored by websites
- **Service Workers**: Background scripts that may cause caching issues

## Privacy Statement

ClearPage values your privacy:

- All operations are performed locally and your data is never sent to external servers
- Your browsing history and website data are not collected or shared
- The permissions required by the extension are only used to perform cache cleaning and performance analysis functions

## Frequently Asked Questions

**Q: Will I lose my login status after clearing cache?**  
A: If you choose to clear cookies, some websites may require you to log in again. We recommend using the Smart Cleaning feature, which intelligently suggests appropriate cleaning items based on website type.

**Q: Why can't performance data be obtained for certain pages?**  
A: Browser security restrictions prevent collecting performance data on specific pages (such as browser built-in pages, extension pages, etc.). On these pages, the extension will display simulated data.

**Q: How do I backup my custom rules?**  
A: Use the "Export Settings" function in the settings page to export all your rules as a JSON file, which can be restored using "Import Settings" when needed.

## Technical Support

If you have any questions or suggestions, please contact us through:

- Email: yhrsc30@gmail.com

## Update Log

### v1.0.9 (Current Version)

- Enhanced performance monitoring functionality, added new metrics such as JS execution time and CSS parsing time
- Improved data cleaning performance, ensuring minimal impact on browser performance during cleaning
- Beautified the performance detection panel, using charts to visually represent resource distribution
- Optimized user interface for improved visual appeal and professional feel
- Fixed known bugs and stability issues

### v1.0.0

- Initial version release
- Implemented basic cache cleaning functionality
- Provided simple performance detection
- Support for custom cleaning rules
