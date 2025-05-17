# 网页数据清理插件状态报告

## 项目概览

**项目名称**: 网页数据清理插件  
**版本**: 1.0.9
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
- ✅ 界面布局优化
- ✅ 自定义清理规则与定时清理
- ✅ 自动性能检测与智能建议

### 待开发功能

- ⏳ 清理历史记录功能优化
- ⏳ 批量清理功能
- ⏳ 高级清理统计

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

#### 6. 插件界面过窄导致内容过长

- **问题描述**: 原有插件宽度不足，导致内容显示过长，用户需要滚动查看
- **解决时间**: 2025-04-25
- **解决方案**:

  1. 增加插件宽度:

     ```tsx
     // 从原来的350px扩展到450-500px
     <div className="min-w-[450px] max-w-[500px] min-h-[200px] bg-white">
       {/* 插件内容 */}
     </div>
     ```

  2. 统一各组件宽度:

     ```tsx
     // CacheClearButton组件
     <div className="..." style={{ width: "450px" }}>
       {/* 组件内容 */}
     </div>

     // PerformancePanel组件
     <div className="..." style={{ width: "450px" }}>
       {/* 组件内容 */}
     </div>

     // SettingsPanel组件
     <div className="..." style={{ width: "450px" }}>
       {/* 组件内容 */}
     </div>
     ```

  3. 优化数据类型布局:

     ```tsx
     // 基础数据类型保持双列
     <div className="grid grid-cols-2 gap-2 mb-2">
       {dataTypeOptions.slice(0, 4).map(({ value, label }) => (
         // 数据类型选择框
       ))}
     </div>

     // 高级数据类型采用三列布局
     <div className="grid grid-cols-3 gap-2">
       {dataTypeOptions.slice(4).map(({ value, label }) => (
         // 高级数据类型选择框
       ))}
     </div>
     ```

  4. 改进视觉层次:
     - 增加了标题分隔，清晰区分基础和高级数据类型
     - 优化了数据类型标签的大小和边距
     - 改进了按钮样式，增加了视觉反馈效果
     - 添加了加载状态动画

- **技术要点**:

  - 使用 Tailwind CSS 的响应式布局
  - CSS Grid 实现更灵活的列布局
  - 使用 SVG 动画增强交互体验
  - 优化文本大小实现信息层次化

- **改进效果**:
  1. 插件界面更加紧凑，减少了滚动需求
  2. 数据类型选择区域布局更合理，适应了不同长度的标签文本
  3. 提升了视觉层次感，增强了用户体验
  4. 保持了移动设备上的良好兼容性

#### 7. 插件界面宽度进一步优化

- **问题描述**: 随着功能增加，450px 宽度仍然不足以完全展示所有内容，需要进一步优化
- **解决时间**: 2025-05-15
- **解决方案**:

  1. 进一步增加插件宽度:

     ```tsx
     // 从450px扩展到750-800px
     <div className="min-w-[750px] max-w-[800px] min-h-[200px] bg-white">
       {/* 插件内容 */}
     </div>
     ```

  2. 统一更新各组件宽度:

     ```tsx
     // CacheClearButton组件
     <div className="..." style={{ width: "750px" }}>
       {/* 组件内容 */}
     </div>

     // PerformancePanel组件
     <div className="..." style={{ width: "750px" }}>
       {/* 组件内容 */}
     </div>

     // SettingsPanel组件
     <div className="..." style={{ width: "750px" }}>
       {/* 组件内容 */}
     </div>
     ```

  3. 多列布局优化:

     ```tsx
     // 基础数据类型改为四列布局
     <div className="grid grid-cols-4 gap-2 mb-2">
       {dataTypeOptions.slice(0, 4).map(({ value, label }) => (
         // 数据类型选择框
       ))}
     </div>

     // 高级数据类型改为五列布局
     <div className="grid grid-cols-5 gap-2">
       {dataTypeOptions.slice(4).map(({ value, label }) => (
         // 高级数据类型选择框
       ))}
     </div>

     // 性能指标改为五列显示
     <div className="grid grid-cols-5 gap-3">
       {/* 性能指标内容 */}
     </div>

     // 资源统计改为四列布局
     <div className="grid grid-cols-4 gap-4">
       {/* 资源统计内容 */}
     </div>
     ```

  4. 历史记录和推荐区域优化:

     - 增加了历史记录数据类型显示区域宽度
     - 优化了推荐数据类型的显示间距
     - 改进了数据类型标签的视觉效果

  5. 内容边距优化:

     ```tsx
     // 为主内容区域添加右侧内边距
     <main className="flex flex-col gap-6 p-4 pr-6">
       {/* 组件内容 */}
     </main>

     // 为各组件内容添加右侧内边距
     <div className="p-3 pr-5">
       {/* 组件内容 */}
     </div>
     ```

- **技术要点**:

  - 更大的宽度设计适应更复杂的功能需求
  - 多列网格布局充分利用空间
  - 优化数据展示密度，提高信息获取效率
  - 保持视觉一致性和层次感
  - 添加适当内边距，确保内容不会紧贴边缘

- **改进效果**:
  1. 显著减少了滚动需求，提高了信息获取效率
  2. 更好地展示了数据类型选择和性能指标，一屏可见更多信息
  3. 历史记录和推荐区域显示更完整，减少了文本截断
  4. 整体界面更加专业，适合高级用户使用
  5. 内容与右边缘保持适当距离，提升了视觉舒适度

#### 8. 移除清理历史记录功能

- **问题描述**: 清理历史记录功能增加了不必要的复杂性，用户反馈使用频率低
- **解决时间**: 2025-05-20
- **解决方案**:

  1. 移除历史记录相关组件和 UI 元素:

     ```tsx
     // 移除历史按钮和显示区域
     <div className="flex items-center gap-3">
       {/* 移除上次清理时间显示 */}
       {/* 移除清理历史按钮 */}
     </div>;

     {
       /* 移除清理历史记录面板 */
     }
     ```

  2. 移除历史记录相关状态和函数:

     ```tsx
     // 移除状态
     const [lastCleanTime, setLastCleanTime] = useState<number | null>(null);
     const [timeSinceLastClean, setTimeSinceLastClean] = useState<string>("");
     const [cleaningHistory, setCleaningHistory] = useState<
       { timestamp: number; dataTypes: DataType[] }[]
     >([]);
     const [showCleaningHistory, setShowCleaningHistory] =
       useState<boolean>(false);

     // 移除函数
     const toggleCleaningHistory = () => {
       setShowCleaningHistory(!showCleaningHistory);
     };
     ```

  3. 移除历史记录服务:

     ```tsx
     // 移除导入
     import { cleanHistoryService } from "../services/historyService";

     // 移除历史记录保存
     await cleanHistoryService.saveCleanHistory(currentDomain, selectedTypes);
     ```

  4. 简化智能清理推荐算法:

     ```tsx
     export const getSmartCleaningRecommendations = (
       domain: string
     ): DataType[] => {
       // 基于网站类型的推荐，不再依赖历史记录
       // ...
     };
     ```

- **技术要点**:

  - 移除不必要的功能，简化代码结构
  - 优化智能推荐算法，不再依赖历史数据
  - 保持核心功能不受影响
  - 减少存储 API 的使用，提高性能

- **改进效果**:
  1. 界面更加简洁，聚焦于核心清理功能
  2. 减少了代码复杂度，提高了可维护性
  3. 减少了存储 API 的使用，提高了性能
  4. 简化了用户体验，减少了不必要的功能干扰

#### 9. 自定义清理规则实现

- **问题描述**: 用户需要根据自己的习惯和需求自定义清理规则，并支持自动定时清理
- **解决时间**: 2025-05-03
- **解决方案**:

  1. 设计清理规则数据结构：

     ```typescript
     interface CleaningRule {
       id: string;
       name: string;
       domain: string;
       dataTypes: DataType[];
       isEnabled: boolean;
       isAutomatic: boolean;
       frequency?: "daily" | "weekly" | "monthly";
       lastCleanTime?: number;
     }
     ```

  2. 实现规则管理界面：

     ```tsx
     const SettingsPanel: React.FC = () => {
       const [rules, setRules] = useState<CleaningRule[]>([]);
       const [editingRule, setEditingRule] = useState<CleaningRule | null>(
         null
       );

       // 加载已保存的规则
       useEffect(() => {
         const fetchRules = async () => {
           const savedRules = await loadRules();
           setRules(savedRules);
         };
         fetchRules();
       }, []);

       // ... 规则编辑、保存、删除等功能
     };
     ```

  3. 实现后台自动清理功能：

     ```typescript
     // 设置定时检查自动清理规则
     const scheduleAutomaticCleaning = () => {
       // 每小时检查一次是否有需要执行的自动清理规则
       chrome.alarms.create("autoCleanCheck", {
         periodInMinutes: 60,
       });

       // 监听定时器事件
       chrome.alarms.onAlarm.addListener((alarm) => {
         if (alarm.name === "autoCleanCheck") {
           runAutomaticCleaning();
         }
       });
     };

     // 执行自动清理
     const runAutomaticCleaning = async (): Promise<void> => {
       const rules = await loadRules();
       const now = Date.now();

       // 根据频率筛选需要执行的规则
       const rulesToExecute = rules.filter((rule) => {
         if (!rule.isEnabled || !rule.isAutomatic) return false;

         const lastClean = rule.lastCleanTime || 0;
         const hoursSinceLastClean = (now - lastClean) / (1000 * 60 * 60);

         if (rule.frequency === "daily" && hoursSinceLastClean >= 24) {
           return true;
         } else if (rule.frequency === "weekly" && hoursSinceLastClean >= 168) {
           return true;
         } else if (
           rule.frequency === "monthly" &&
           hoursSinceLastClean >= 720
         ) {
           return true;
         }

         return false;
       });

       // 执行清理并更新规则
       // ...
     };
     ```

  4. 导航优化：
     - 添加了标签式导航，区分"清理数据"、"性能检测"和"设置"
     - 实现了无缝切换，保持每个标签页的状态
     - 优化了移动设备上的导航体验

- **技术要点**:

  - 使用 React Hooks 管理规则状态和 UI 交互
  - 使用 Chrome Storage API 实现规则持久化
  - 使用 Chrome Alarms API 实现定时任务
  - 精确计算时间间隔确保按频率执行清理

- **改进效果**:
  1. 用户可以创建、编辑和管理自定义清理规则
  2. 支持按域名模式（支持通配符）和数据类型定制规则
  3. 实现了自动定时清理功能，支持每日、每周、每月频率
  4. 改善了用户体验，减少了手动清理的操作需求

#### 10. 自动性能检测与智能建议应用

- **问题描述**: 用户需要手动点击按钮才能执行性能检测或应用智能清理建议，操作流程不够便捷
- **解决时间**: 2025-05-10
- **解决方案**:

  1. 实现自动性能检测：

     ```tsx
     // 组件挂载时自动执行性能检测
     useEffect(() => {
       runPerformanceCheck();
     }, []);
     ```

  2. 使用 key 值控制性能面板重新渲染：

     ```tsx
     // 切换到性能检测标签时触发重新渲染
     const handleTabChange = (tab: "clean" | "performance" | "settings") => {
       setActiveTab(tab);
       if (tab === "performance") {
         // 更新key以强制PerformancePanel重新渲染
         setPerformancePanelKey((prevKey) => prevKey + 1);
       }
     };

     // 在渲染性能面板组件时使用key属性
     {
       activeTab === "performance" && (
         <div className="pt-0">
           <PerformancePanel key={performancePanelKey} />
         </div>
       );
     }
     ```

  3. 智能建议自动应用：

     ```tsx
     useEffect(() => {
       if (!currentDomain) return;

       const getRecommendations = async () => {
         try {
           const history = await cleanHistoryService.getCleanHistory();
           const smartRecommendations = getSmartCleaningRecommendations(
             currentDomain,
             history.map((h) => ({ domain: h.domain, dataTypes: h.dataTypes }))
           );

           // 确保至少包含基本缓存
           if (!smartRecommendations.includes("cache")) {
             smartRecommendations.push("cache");
           }

           setRecommendations(smartRecommendations);
           setCleaningAdvice(
             getCleaningAdvice(currentDomain, smartRecommendations)
           );

           // 自动应用智能建议到复选框选择中
           setSelectedTypes([...smartRecommendations]);
         } catch (error) {
           console.error("获取智能推荐失败:", error);
         }
       };

       getRecommendations();
     }, [currentDomain]);
     ```

  4. 全选/取消全选功能：
     - 为基础数据类型添加了全选/取消全选按钮
     - 为高级数据类型添加了全选/取消全选按钮
     - 智能识别当前选择状态，动态显示按钮文本

- **技术要点**:

  - 使用 React useEffect 钩子实现自动执行
  - 使用组件 key 属性控制组件重新渲染
  - 优化用户界面，提供即时反馈
  - 添加状态指示，清晰显示已应用的智能建议

- **改进效果**:
  1. 切换到性能检测标签页后自动执行检测，不需要用户再点击"检测"按钮
  2. 插件打开时自动应用智能建议，复选框自动选中推荐的数据类型
  3. 添加了全选/取消全选功能，方便用户快速选择数据类型
  4. 大幅优化了用户体验，减少了重复点击操作

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

## 更新日志

### 2025-05-10

- ✨ 实现性能检测自动执行，用户切换到检测标签页后自动显示结果
- 🚀 优化智能建议，开启插件时自动应用推荐的数据类型
- 📋 新增数据类型全选/取消全选功能，提升操作便捷性

### 2025-05-03

- ✨ 新增自定义清理规则功能，支持用户创建、编辑和管理规则
- 🚀 实现自动定时清理功能，支持每日、每周和每月频率
- 🔄 优化界面导航，添加标签式切换

### 2025-04-25

- 🎨 优化插件界面布局，增加宽度，提高可用性
- ✨ 改进数据类型显示方式，采用分组和多列布局
- 🚀 增强按钮和交互元素的视觉效果和反馈

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
