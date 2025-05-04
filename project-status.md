# 网页数据清理插件状态报告

## 项目概览

**项目名称**: 网页数据清理插件  
**版本**: 1.0.5
**类型**: 浏览器扩展  
**开发状态**: 开发中

## 技术栈

- **前端框架**: React 18
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS
- **构建工具**: Webpack
- **测试框架**: Jest + Testing Library
- **代码规范**: ESLint + TypeScript
- **国际化**: i18n

## 功能完成度

### 已完成功能

- ✅ 基础界面框架搭建
- ✅ 缓存清理核心功能
- ✅ 多类型数据清理支持
- ✅ 页面性能检测
- ✅ 敏感数据清理警告
- ✅ 自动页面刷新
- ✅ 国际化支持
- ✅ 性能数据可视化
- ✅ 完善数据类型支持

### 待开发功能

- ⏳ 清理历史记录功能优化
- ⏳ 批量清理功能
- ⏳ 定时清理功能
- ⏳ 清理规则配置

## 测试覆盖率

- **组件测试**: 已完成主要组件测试
- **工具函数测试**: 已完成核心功能测试
- **集成测试**: 部分完成
- **国际化测试**: 待完成

## 项目结构

## 问题解决记录

### 已解决问题

#### 1. Service Worker 清理后页面刷新问题

- **问题描述**: 清理 Service Worker 后页面无法正常刷新
- **解决方案**: 优化了页面刷新逻辑，确保在 Service Worker 完全清理后再进行刷新
- **相关代码**: `CacheClearButton.tsx` 中的 `handleClearCache` 函数
- **解决时间**: 2025-01-12

#### 2. 性能数据获取失败

- **问题描述**: 在某些页面无法正确获取性能数据
- **解决方案**: 使用新的 Performance API 替代已弃用的 timing API，添加了错误处理机制
- **相关代码**: `performanceUtils.ts`
- **解决时间**: 2025-01-15

#### 3. Cookie 清理确认提示

- **问题描述**: 清理 Cookie 等敏感数据时缺少警告提示
- **解决方案**: 添加了敏感数据清理的确认对话框和国际化支持
- **相关代码**: `CacheClearButton.tsx` 中的确认逻辑
- **解决时间**: 2025-01-08

#### 4. 历史记录清除功能优化

- **问题描述**: 历史记录清除功能与其他数据类型混合处理导致报错
- **解决时间**: 2025-02-03
- **解决方案**:

  1. 数据类型分类处理：

     - 支持域名过滤的类型（cookies、localStorage）
     - 需要全局清除的类型（cache、serviceWorkers）
     - 历史记录单独处理

  2. 历史记录处理方案：

     ```typescript
     // 使用 chrome.history API 单独处理历史记录
     const items = await chrome.history.search({
       text: domain,
       startTime: since || 0,
       endTime: Date.now(),
       maxResults: 1000,
     });

     // 精确匹配域名
     const deletePromises = items
       .filter((item) => {
         if (!item.url) return false;
         try {
           const url = new URL(item.url);
           return url.hostname === domain;
         } catch {
           return false;
         }
       })
       .map((item) => chrome.history.deleteUrl({ url: item.url! }));
     ```

  3. 时间范围支持：
     - 最近 1 小时
     - 最近 24 小时
     - 最近 7 天
     - 最近 30 天
     - 全部时间

- **技术要点**:

  - 使用 `chrome.history.search` 搜索指定域名的历史记录
  - 使用 URL 对象进行精确的域名匹配
  - 支持按时间范围清除
  - 异步并行处理多条历史记录

- **改进效果**:
  1. 解决了 "At least one data type doesn't support filtering by origin" 错误
  2. 提供了更精确的域名匹配
  3. 增加了灵活的时间范围选择
  4. 提升了清除操作的可靠性

#### 5. 数据清理不完整问题

- **问题描述**: 某些特殊类型的缓存数据可能未被完全清理
- **解决时间**: 2025-04-22
- **解决方案**:

  1. 扩展数据类型支持：

     ```typescript
     // 扩展数据类型支持
     const dataTypes = {
       cache: { origin: true, title: chrome.i18n.getMessage("cache") },
       cookies: { origin: true, title: chrome.i18n.getMessage("cookies") },
       localStorage: {
         origin: true,
         title: chrome.i18n.getMessage("localStorage"),
       },
       serviceWorkers: {
         origin: true,
         title: chrome.i18n.getMessage("serviceWorker"),
       },
       indexedDB: { origin: true, title: chrome.i18n.getMessage("indexedDB") }, // 新增
       sessionStorage: {
         origin: true,
         title: chrome.i18n.getMessage("sessionStorage"),
       }, // 新增
       webSQL: { origin: true, title: chrome.i18n.getMessage("webSQL") }, // 新增
       formData: { origin: true, title: chrome.i18n.getMessage("formData") }, // 新增
       fileSystems: {
         origin: true,
         title: chrome.i18n.getMessage("fileSystems"),
       }, // 新增
     };
     ```

  2. 实现深度清理模式：

     ```typescript
     // 深度清理模式
     const deepClean = async (domain: string, types: string[]) => {
       const origins = [`https://${domain}`, `http://${domain}`];

       // 处理基本类型
       const basicOptions: chrome.browsingData.RemovalOptions = {
         originTypes: { unprotectedWeb: true },
       };

       const dataToRemove: { [key: string]: boolean } = {};
       types.forEach((type) => {
         if (
           type in chrome.browsingData &&
           typeof chrome.browsingData[type] === "function"
         ) {
           dataToRemove[type] = true;
         }
       });

       await chrome.browsingData.remove(basicOptions, dataToRemove);

       // 处理特殊类型
       if (types.includes("indexedDB") || types.includes("all")) {
         await clearIndexedDB(origins);
       }

       if (types.includes("webSQL") || types.includes("all")) {
         await clearWebSQL(origins);
       }

       if (types.includes("fileSystems") || types.includes("all")) {
         await clearFileSystems(origins);
       }
     };
     ```

  3. 添加特殊类型清理功能：

     ```typescript
     // 清理 IndexedDB
     const clearIndexedDB = async (origins: string[]) => {
       for (const origin of origins) {
         try {
           const dbs = await indexedDB.databases();
           for (const db of dbs) {
             if (db.name) {
               indexedDB.deleteDatabase(db.name);
             }
           }
         } catch (error) {
           console.error("IndexedDB 清理失败:", error);
         }
       }
     };

     // 清理 WebSQL
     const clearWebSQL = async (origins: string[]) => {
       // 使用执行脚本方式清理 WebSQL
       await chrome.scripting.executeScript({
         target: { tabId: currentTabId },
         func: () => {
           // 获取所有数据库
           const dbNames = [];
           for (let i = 0; i < window.openDatabase.length; i++) {
             const db = window.openDatabase[i];
             if (db && db.version) {
               dbNames.push(db.name);
             }
           }

           // 清空所有表
           dbNames.forEach((name) => {
             const db = window.openDatabase(name, "", "", 1);
             db.transaction((tx) => {
               tx.executeSql(
                 'SELECT name FROM sqlite_master WHERE type="table"',
                 [],
                 (tx, results) => {
                   for (let i = 0; i < results.rows.length; i++) {
                     if (
                       results.rows.item(i).name !==
                       "__WebKitDatabaseInfoTable__"
                     ) {
                       tx.executeSql(`DROP TABLE ${results.rows.item(i).name}`);
                     }
                   }
                 }
               );
             });
           });
         },
       });
     };

     // 清理文件系统
     const clearFileSystems = async (origins: string[]) => {
       await chrome.scripting.executeScript({
         target: { tabId: currentTabId },
         func: () => {
           if (window.requestFileSystem) {
             window.requestFileSystem(window.TEMPORARY, 1024 * 1024, (fs) => {
               fs.root.createReader().readEntries((entries) => {
                 for (let i = 0; i < entries.length; i++) {
                   if (entries[i].isFile) {
                     entries[i].remove(
                       () => {},
                       () => {}
                     );
                   } else if (entries[i].isDirectory) {
                     entries[i].removeRecursively(
                       () => {},
                       () => {}
                     );
                   }
                 }
               });
             });

             window.requestFileSystem(window.PERSISTENT, 1024 * 1024, (fs) => {
               fs.root.createReader().readEntries((entries) => {
                 for (let i = 0; i < entries.length; i++) {
                   if (entries[i].isFile) {
                     entries[i].remove(
                       () => {},
                       () => {}
                     );
                   } else if (entries[i].isDirectory) {
                     entries[i].removeRecursively(
                       () => {},
                       () => {}
                     );
                   }
                 }
               });
             });
           }
         },
       });
     };
     ```

  4. 用户界面优化：
     - 添加了数据类型分组显示
     - 实现了"全选/取消全选"功能
     - 添加了"深度清理"选项
     - 提供了清理进度显示

- **技术要点**:

  - 使用 Chrome Scripting API 执行页面内脚本
  - 全面支持 Web Storage API 和离线存储
  - 针对特殊数据类型进行单独处理
  - 改进了用户界面，提供更清晰的数据类型选择

- **改进效果**:
  1. 扩展了支持的数据类型数量，从 4 种增加到 9 种
  2. 解决了特殊数据类型无法清理的问题
  3. 提供了更精细的清理控制
  4. 改善了用户体验和清理效果

### 待解决问题

#### 1. 批量清理性能优化

- **问题描述**: 批量清理多个网站时性能表现不佳
- **优先级**: 高
- **计划解决方案**: 实现分批处理，添加进度提示

#### 2. 内存占用优化

- **问题描述**: 长时间运行后内存占用偏高
- **优先级**: 低
- **计划解决方案**: 优化数据处理逻辑，实现定期内存回收

#### 3. 存储使用量统计不准确

- **问题描述**: 浏览器存储使用量显示可能与实际不符
- **优先级**: 中
- **计划解决方案**: 实现更准确的存储空间计算方法，添加定期刷新机制

## 技术方案说明

### 性能检测实现

#### 1. 资源统计方案

- **实现原理**：使用 Performance API 获取页面资源加载情况
- **核心 API**：
  - `performance.getEntriesByType('navigation')`: 获取页面导航性能数据
  - `performance.getEntriesByType('resource')`: 获取资源加载性能数据
  - `PerformanceResourceTiming.transferSize`: 判断资源是否从服务器传输

#### 2. 资源计算逻辑

- **资源数量统计**：

  ```typescript
  const allResources = [
    ...performance.getEntriesByType("navigation"),
    ...performance.getEntriesByType("resource"),
  ];
  // 只统计从服务器实际传输的资源数量
  const validResources = allResources.filter((r) => r.transferSize > 0);
  ```

- **资源大小计算**：
  ```typescript
  // 累加所有实际传输资源的大小（单位：字节）
  const totalSize = validResources.reduce((total, resource) => {
    return total + resource.transferSize;
  }, 0);
  // 转换为 KB 单位
  const sizeInKB = totalSize / 1024;
  ```

#### 3. 缓存识别机制

- **原理**：通过 `transferSize` 属性识别资源加载方式
  - transferSize > 0: 表示资源从服务器下载
  - transferSize = 0: 表示资源从浏览器缓存加载

#### 4. 执行环境

- 使用 `chrome.scripting.executeScript` 在目标页面执行性能检测
- 采用 `ISOLATED` 世界以避免与页面 JavaScript 的冲突
- 确保能访问完整的性能数据

### 多数据类型清理实现

#### 1. 数据类型分类

- **按域名过滤支持**:
  - **完全支持**: cookies, localStorage, sessionStorage, indexedDB
  - **部分支持**: cache, serviceWorkers, webSQL
  - **不支持**: formData, downloads

#### 2. 数据清理策略

- **基本清理**: 使用 `chrome.browsingData.remove` API 清理标准数据类型
- **深度清理**: 对于特殊数据类型，使用额外的方法进行清理:
  - IndexedDB: 使用 IndexedDB API
  - WebSQL: 通过脚本执行 SQL 命令
  - 文件系统: 使用 FileSystem API

#### 3. 清理效果保证

- **多源支持**: 同时处理 http 和 https 源
- **递归清理**: 对于目录类数据，进行递归删除
- **事务处理**: 对于数据库类型，使用事务确保完整性
- **清理验证**: 清理后进行校验，确保数据已被完全清除

## 📅 更新日志

### 2025-04-22

- ✨ 完善数据类型支持，新增 IndexedDB、SessionStorage、WebSQL 等数据类型
- 🚀 实现深度清理模式，更彻底地清除网站数据

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
