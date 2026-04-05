# AutoLedger v1.0 交付文档

## 项目概述

AutoLedger 是一款基于 React 的个人智能记账 Web 应用，支持手动记账、AI 自动分类、文本导入解析、月度财务报告等功能。

- **技术栈**: React 18 + Vite 5 + Recharts + localStorage
- **零后端依赖**: 所有数据存储在浏览器本地，AI 分类通过用户自配的 OpenAI API 实现
- **第三方依赖**: nanoid（ID 生成）、recharts（图表）、vitest（测试）

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 测试监听模式
npm run test:watch

# 预览构建产物
npm run preview
```

---

## 功能清单

### F1. 手动记账
- 输入金额、备注、日期、标签
- 支出/收入类型切换
- 分类选择器（图标+颜色网格）
- 备注输入后自动触发 AI 分类（需配置 API Key）

### F2. 文本导入
- 粘贴银行短信、支付宝/微信通知文本
- 自动解析金额、商家、交易类型、日期
- 支持多行批量解析
- 剪贴板自动检测（页面获焦时检测交易信息）
- 去重机制（基于文本内容 hash）

### F3. 分类管理
- 14 个预设支出分类 + 5 个预设收入分类
- 自定义分类增删改（名称、图标、颜色）
- 预设分类不可删除

### F4. AI 智能分类
- 对接 OpenAI 兼容 API（可配置 endpoint/model/key）
- 异步分类：先保存交易，AI 返回后更新分类
- 离线回退：无 API Key 时用户手动选择
- 低温度参数确保分类稳定性

### F5. 待确认记录
- 自动导入的记录默认为"待确认"状态
- 独立待确认列表页，支持确认/编辑/删除
- 编辑支持修改金额、备注、日期、类型、分类
- 批量确认功能
- Dashboard 待确认横幅一键跳转

### F6. 月度报告
- 支出分类饼图（Recharts PieChart）
- 每日收支趋势线图（LineChart）
- 预算对比柱状图（BarChart）
- 环比分析（支出/收入变化百分比）
- 异常检测（某分类消费同比增长超 50% 告警）
- PDF 导出（格式化 HTML 打印，零依赖）

### F7. 预算管理
- 按月设置总预算或分类预算
- Dashboard 预算进度条（正常/警告/超支三色）
- 报告页预算执行对比

### F8. 数据管理
- JSON 格式导出备份（自动脱敏 API Key）
- JSON 格式导入恢复
- 所有数据 localStorage 持久化

---

## 项目结构

```
src/
├── App.jsx                          # 路由 + 页面切换
├── main.jsx                         # React 入口
├── styles.css                       # 全局样式
├── context/
│   └── AppContext.jsx               # 全局状态管理 (useReducer)
├── data/
│   └── presetCategories.js          # 19 个预设分类
├── utils/
│   └── constants.js                 # 常量定义
├── services/
│   ├── storage.js                   # localStorage 读写
│   ├── aiClassification.js          # AI API 调用
│   ├── textParsing.js               # 交易文本解析引擎
│   ├── clipboardMonitor.js          # 剪贴板检测
│   ├── reportGenerator.js           # 报告数据聚合 + 异常检测
│   ├── pdfExporter.js               # PDF 导出
│   └── __tests__/
│       ├── aiClassification.test.js # 10 个用例
│       ├── reportGenerator.test.js  # 22 个用例
│       └── textParsing.test.js      # 29 个用例
└── components/
    ├── common/
    │   └── TabBar.jsx               # 底部导航栏
    ├── Dashboard/
    │   └── DashboardView.jsx        # 首页仪表盘
    ├── AddTransaction/
    │   ├── AddTransactionView.jsx   # 手动记账
    │   └── CategoryPickerView.jsx   # 分类选择器
    ├── Import/
    │   └── TextImportView.jsx       # 文本导入 + 剪贴板粘贴
    ├── Pending/
    │   └── PendingListView.jsx      # 待确认列表（含编辑）
    ├── Categories/
    │   └── CategoryListView.jsx     # 分类管理（含编辑 Modal）
    ├── Reports/
    │   └── MonthlyReportView.jsx    # 月度报告（含图表）
    └── Settings/
        └── SettingsView.jsx         # 设置 + 预算管理 + 数据备份
```

---

## 架构设计

### 状态管理

采用 React `useReducer` + Context 模式，单一数据源：

```
AppContext
├── transactions[]    # 交易记录
├── categories[]      # 分类列表
├── budgets[]         # 预算配置
└── settings{}        # 用户设置
```

每次状态变更自动同步到 localStorage，页面刷新后自动恢复。

### 数据模型

**Transaction**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | nanoid 生成 |
| amount | number | 金额 |
| note | string | 备注 |
| date | string | YYYY-MM-DD |
| type | 'income' \| 'expense' | 交易类型 |
| categoryId | string \| null | 分类 ID |
| tags | string[] | 用户标签 |
| source | 'manual' \| 'clipboard' | 来源 |
| isConfirmed | boolean | 是否已确认 |
| sourceHash | string \| null | 去重 hash |
| createdAt | string | ISO 时间戳 |

**Category**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 分类 ID |
| name | string | 名称 |
| icon | string | Emoji 图标 |
| color | string | HEX 颜色 |
| type | 'income' \| 'expense' | 分类类型 |
| isPreset | boolean | 是否预设 |
| sortOrder | number | 排序 |

### 文本解析引擎

`textParsing.js` 使用正则匹配提取交易信息：

- **金额**: 支持 `¥`/`￥`/`CNY`/`RMB` 前缀、`元`/`块` 后缀、`金额：` 格式
- **商家**: 匹配 `在X消费`、`商户：X` 等模式
- **类型**: 关键词检测（消费/支出→expense，收入/到账→income）
- **日期**: 支持 `YYYY年MM月DD日`、`YYYY-MM-DD`、`MM月DD日`

---

## 测试

```
3 个测试文件，61 个用例，100% 通过

aiClassification.test.js (10 用例)
├── 无 API Key 降级
├── 正常分类匹配
├── 请求参数验证
├── API 错误容错
├── 网络异常容错
└── 边界情况处理

reportGenerator.test.js (22 用例)
├── getMonthTransactions - 按月筛选 + 排除未确认
├── getMonthSummary - 收支汇总 + 精度
├── getCategoryBreakdown - 分类聚合 + 排序
├── getDailyTrend - 按日聚合
├── getBudgetComparison - 预算执行率
├── getMoMComparison - 环比 + 跨年处理
└── detectAnomalies - 异常检测阈值

textParsing.test.js (29 用例)
├── 金额提取 - 6 种格式 + 边界
├── 商家提取 - 多种模式
├── 类型检测 - 收入/支出关键词
├── 日期解析 - 3 种格式 + 默认值
├── 输出字段校验 - hash 一致性
└── 真实场景 - 银行短信/支付宝/工资通知
```

---

## 预设分类

### 支出（14 个）
餐饮、交通、购物、娱乐、居住、医疗、教育、通讯、服饰、日用、社交、旅行、宠物、其他

### 收入（5 个）
工资、兼职、投资、红包、其他收入

---

## 使用指南

### 首次使用
1. `npm install && npm run dev` 启动应用
2. 进入"设置"页配置 AI API（可选）
3. 在"记账"页输入第一笔交易
4. 在"设置"页设置月度预算

### AI 分类配置
在设置页填写：
- **API Key**: OpenAI 或兼容服务的密钥
- **API 地址**: 默认 `https://api.openai.com/v1/chat/completions`，可替换为任意 OpenAI 兼容 endpoint
- **模型**: 默认 `gpt-3.5-turbo`

### 文本导入
1. 复制银行短信或支付通知
2. 进入"导入"页，点击"从剪贴板粘贴"或手动粘贴
3. 点击"解析文本"
4. 确认解析结果后导入

### PDF 导出
1. 进入"报告"页
2. 选择目标月份
3. 点击"导出 PDF"
4. 在弹出的打印窗口中选择"另存为 PDF"

---

## 已知限制

| 项目 | 说明 |
|------|------|
| 数据存储 | 仅 localStorage，清除浏览器数据会丢失（建议定期导出备份） |
| OCR 扫描 | v1 未实现，可在后续版本中集成 Tesseract.js |
| 多设备同步 | 不支持，v2 可考虑 IndexedDB + 云同步方案 |
| 离线 AI | AI 分类需要网络，离线时需手动选择分类 |
| 构建体积 | JS 包 ~580KB（主要是 recharts），可通过代码分割优化 |

---

## 后续迭代建议

1. **PWA 支持**: 添加 Service Worker + manifest，支持离线使用和添加到主屏幕
2. **暗色模式**: CSS 变量已就位，添加 `prefers-color-scheme` 媒体查询即可
3. **OCR 扫描**: 集成 Tesseract.js 实现小票拍照识别
4. **数据可视化增强**: 年度汇总、分类趋势对比、收支预测
5. **IndexedDB**: 替代 localStorage 以支持更大数据量
6. **iCloud/云同步**: 通过后端服务实现多设备数据同步
7. **国际化**: i18n 支持多语言
8. **代码分割**: 按路由懒加载，减小首屏体积
