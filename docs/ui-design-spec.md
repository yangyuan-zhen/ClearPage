# ClearPage UI 设计规范

## 布局与响应式
 - 弹窗容器：`min-w 520px`、`max-w 640px`、`h 600px`
 - 侧边栏：`w 144/160/176px`（随断点），主内容 `flex-1`
 - 主内容滚动：`overflow-y-auto`

## 颜色与对比
 - 主色：`#4F46E5`，辅色：`#64748B`，强调：`#10B981`
 - 语义色：成功 `#22C55E`、危险 `#EF4444`、警告 `#F59E0B`
 - 背景与边框：`#F1F5F9` / `#E5E7EB`
 - 文本对比：正文 `#0f172a`，次要 `#475569`

## 排版与间距
 - 字体大小：标题 `24/20/16`，正文 `14`，辅助 `12`
 - 行高：`1.5`，段落间距：`8–12px`
 - 组件内边距：按钮 `8–12px`，输入框 `8px`

## 组件规范
 - 按钮：`.btn-base`、`.btn-primary`、`.btn-secondary`、`.btn-outline`
 - 输入：`.input`，下拉：`.select`
 - 卡片：`.card` 统一圆角、阴影与内边距
 - 侧边项：`.sidebar-item` 单行、焦点可见、活动态 `.sidebar-item-active`

## 交互与动效
 - 过渡：统一 `duration-200`、`hover` 阴影与颜色过渡
 - 无障碍：`focus-visible` 的环形高亮、`aria-current="page"` 标记
 - 减少动效：遵循 `prefers-reduced-motion`（`motion-reduce:transition-none`）

## 无障碍与键盘
 - 导航设置 `role="navigation" aria-label="主导航"`
 - 所有可交互元素可通过 `Tab` 聚焦，`Enter/Space`触发
 - 颜色对比符合 WCAG AA（文本与背景≥4.5:1）

## 浏览器兼容
 - Chrome/Edge/Firefox 最新版本
 - Tailwind 工具类输出为标准 CSS，避免私有前缀依赖