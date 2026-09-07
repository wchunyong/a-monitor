# A 股监控项目推进 Roadmap

## 1. Roadmap 定位

本 Roadmap 基于 `docs/prd-market-monitoring.md`，并参考 `a-share-heatmap` 的现有结构制定。目标不是把热力图项目整体复制过来，而是复用其成熟的行情抓取、股票池、缓存、降级和前端轮询经验，逐步形成独立的 `a-monitor` 看盘监控项目。

`a-share-heatmap` 当前是 Next.js App Router 项目，核心结构包括：

- `src/app/api/heatmap/*/route.ts`：服务端 API Routes，对前端暴露行情、概览、搜索、成分股接口。
- `src/lib/market-heatmap.ts`：全市场股票池、东方财富/新浪行情抓取、指数概览、缓存、fallback 数据和聚合逻辑。
- `src/lib/market-constituents.ts`：指数成分股获取与缓存。
- `src/lib/data/*.json`：内置股票池、板块、fallback 行情快照。
- `src/components/market-heatmap.tsx`：前端 8 秒轮询、筛选、表格/画布交互、设置和本地偏好。

`a-monitor` 应继承这些工程习惯，但需要拆出更清晰的监控边界：行情数据层、业务规则层、监控状态层、API 层、页面展示层。

## 2. 总体推进原则

- 一期优先交付可用的看盘辅助工具：涨停压力位推荐 + 竞价固定价兼容采样模式。
- 行情采集统一放在服务端，前端只读取服务端状态，避免每个浏览器独立全量抓取。
- 先沿用公开行情接口和内存缓存，明确展示数据模式与风险提示。
- 监控判断必须记录数据源、数据时间、数据模式，避免给出无法证明的结论。
- 严格 tick/逐笔模式、外部推送、历史回放放到二期，避免一期被数据源不确定性拖住。

## 3. 目标项目结构

建议 `a-monitor` 采用与 `a-share-heatmap` 相近的 Next.js 结构，但从第一天拆分领域模块：

```text
src/
  app/
    page.tsx
    layout.tsx
    api/
      monitor/
        auction-fixed-price/route.ts
        limit-up-pressure/route.ts
        status/route.ts
      stocks/
        search/route.ts
  components/
    monitor-shell.tsx
    auction-fixed-price-panel.tsx
    limit-up-pressure-panel.tsx
    monitor-table.tsx
    status-badge.tsx
  lib/
    market/
      stock-universe.ts
      quote-provider.ts
      quote-cache.ts
      historical-kline-provider.ts
      limit-price-rules.ts
    monitor/
      auction-fixed-price.ts
      limit-up-pressure.ts
      trading-clock.ts
      monitor-types.ts
    data/
      market-heatmap-fallback.json
      market-heatmap-subboards.json
```

首轮可以直接从 `a-share-heatmap` 迁移或改造这些能力：

- `src/lib/data/market-heatmap-fallback.json`
- `src/lib/data/market-heatmap-subboards.json`
- `src/lib/market-heatmap.ts` 中的股票池解析、市场划分、远程行情抓取、缓存和 fallback 策略
- `src/app/api/heatmap/search/route.ts` 的股票搜索思路
- 前端 8 秒轮询与状态提示模式

迁移时不要保留热力图绘制、截图分享、主题编辑、自选股 AI 等与监控一期无关的功能。

## 4. 阶段 0：项目骨架与迁移准备

目标：把 `a-monitor` 从文档仓库推进为可运行的 Next.js 项目。

任务：

- 初始化 Next.js、React、TypeScript、Tailwind、ESLint、pnpm 配置。
- 复用 `a-share-heatmap` 的基础脚本：`dev`、`build`、`start`、`lint`、`typecheck`。
- 建立 `src/app`、`src/lib`、`src/components`、`src/lib/data` 目录。
- 迁移股票池与板块 fallback JSON。
- 新增 `README.md`，说明项目目标、运行命令、数据风险。
- 建立基础页面壳：顶部状态区 + 两个 Tab，分别对应“竞价固定价”和“涨停压力位”。

验收：

- `pnpm install`、`pnpm lint`、`pnpm typecheck`、`pnpm build` 可运行。
- 首页能打开，并展示两个监控 Tab 的空状态。
- 仓库可以正常推送远端 `main`。

## 5. 阶段 1：行情内核抽取

目标：先拥有稳定的全市场实时快照能力，作为两个监控工作流的公共基础。

任务：

- 从 `a-share-heatmap` 抽取股票基础信息模型：代码、名称、交易所、一级板块、二级板块、价格、涨跌幅、成交额。
- 新建 `quote-provider.ts`，封装东方财富 clist、东方财富 ulist、Sina 备援抓取。
- 新建 `quote-cache.ts`，保留 8 秒短缓存、并发请求合并、上次成功快照回退。
- 新建 `stock-universe.ts`，负责股票池、市场筛选、代码解析和搜索。
- API 暴露 `/api/monitor/status`，返回行情源、更新时间、股票数、是否 fallback。
- API 暴露 `/api/stocks/search`，供后续筛选和人工查验使用。

验收：

- 服务端可以获取全市场快照。
- 上游失败时返回上次成功快照或 fallback 数据。
- API 响应明确包含 `source`、`updatedAt`、`stale`、`mode`。
- 单元测试覆盖代码解析、市场筛选、缓存命中和 fallback 分支。

## 6. 阶段 2：涨停价规则与涨停识别

目标：建立涨停股识别能力，为压力位推荐铺路。

任务：

- 新建 `limit-price-rules.ts`，实现主板、创业板、科创板、北交所、ST 的涨停幅度规则。
- 实现价格最小变动单位下的涨停价四舍五入。
- 对新股、复牌、特殊监管状态先标记为 `rule_pending`，不做强判断。
- 扩展行情字段，至少保留当前价、昨收价、涨跌幅、交易所、股票名称、板块。
- 新建 `limit-up-pressure.ts` 中的第一层能力：从实时快照筛出触及涨停的股票。
- API 暴露 `/api/monitor/limit-up-pressure` 的基础版本，先返回涨停列表和规则状态。

验收：

- 能识别当前触及涨停价的股票。
- ST 与不同板块涨跌幅规则分支有测试。
- 特殊规则不确定的股票不会被误标为“明确涨停”。
- 页面涨停压力位 Tab 能展示基础涨停列表、更新时间和数据源。

## 7. 阶段 3：历史 K 线与压力位推荐

目标：完成 PRD 中“一期最有价值”的涨停压力位推荐。

任务：

- 新建 `historical-kline-provider.ts`，接入东方财富或其他可用日 K 数据源。
- 默认优先取最近 3 个月前复权收盘价；不支持前复权时回退为不复权并标记。
- 对每只涨停股计算 3 个月最高收盘价和对应日期。
- 判断结论：
  - `no_obvious_close_pressure`：最高收盘价小于或等于今日涨停价。
  - `has_close_pressure`：最高收盘价高于今日涨停价。
  - `history_unavailable`：历史数据不可用。
  - `rule_pending`：涨停价规则不确定。
- 对历史 K 线结果做日级缓存，避免盘中重复请求同一股票。
- 页面支持筛选：只看无明显压力位、排除 ST、排除新股、市场、板块。

验收：

- API 返回 PRD 要求的全部展示字段。
- 历史数据失败时不输出误导性推荐。
- 页面统计当前涨停股、无明显压力、有压力、历史不可用数量。
- 页面轮询间隔建议 8-10 秒，历史 K 线缓存不随实时轮询重复击穿。

## 8. 阶段 4：竞价固定价兼容采样模式

目标：实现 9:15-9:30 的固定价采样监控，明确标记“采样判断”。

任务：

- 新建 `trading-clock.ts`，基于 Asia/Shanghai 交易时间判断阶段：
  - `waiting`：9:15 前
  - `collecting`：9:15-9:20
  - `monitoring`：9:20-9:30
  - `finished`：9:30 后
  - `closed`：非交易日或非竞价窗口
- 新建 `auction-fixed-price.ts`，维护内存中的采样状态：
  - 9:15-9:20 每 8-10 秒记录全市场价格样本。
  - 9:20 生成初始候选池。
  - 9:20-9:30 每 10 秒检查候选股票最新价。
  - 价格变化则移除，并记录首次波动价格与移除时间。
  - 9:30 标记最终保留股票为 `finished`。
- API 暴露 `/api/monitor/auction-fixed-price`，返回当前阶段、候选列表、统计和数据模式。
- 页面展示阶段状态、候选数、移除数、最终保留数、候选表格和采样风险提示。

验收：

- 9:15-9:20 可持续采样。
- 9:20 自动生成候选列表。
- 9:20-9:30 每 10 秒剔除价格波动股票。
- 9:30 后停止监控并保留最终列表。
- 页面明确展示“兼容采样模式，不能证明采样点之间无波动”。

## 9. 阶段 5：监控页面体验

目标：把两个工作流打磨成可长期打开的工作台。

任务：

- 建立 `monitor-shell.tsx`，采用紧凑型工作台布局，不做营销页。
- 顶部展示全局数据源状态、最近行情时间、是否 fallback。
- 两个 Tab：
  - 竞价固定价
  - 涨停压力位
- 表格支持排序、筛选、关键状态标签、空状态和错误状态。
- 使用 `sonner` 做页面内提醒：
  - 9:20 候选列表生成
  - 候选股票被移除
  - 新增无明显压力位涨停股
- 保留移动端可读性，但优先服务桌面盘中盯盘。

验收：

- 页面无需刷新即可看到监控状态变化。
- 筛选不会改变服务端监控结论，只影响前端展示。
- 数据延迟、fallback、历史不可用、规则待确认都有可见状态。

## 10. 阶段 6：部署与运行策略

目标：让一期在普通部署环境可运行，并明确生产限制。

任务：

- 沿用 `a-share-heatmap` 的 Dockerfile/Next standalone 思路。
- Vercel 可作为演示环境，但竞价采样依赖内存状态，生产建议 Docker 常驻进程部署。
- README 写清：
  - Serverless 多实例下内存缓存不稳定。
  - 竞价采样需要服务在 9:15 前启动并保持运行。
  - 公开接口有频控和失效风险。
- 增加健康检查 API：返回进程启动时间、最近采样时间、最近行情成功时间。

验收：

- Docker 构建可用。
- 部署后 API 能返回健康状态。
- 监控页面在行情源失败时能显示可理解的降级状态。

## 11. 二期扩展路线

二期目标是在一期可用的基础上提升准确性、可追溯性和通知能力。

方向：

- 严格 tick/逐笔/竞价明细模式：
  - 接入 Level-2、券商或第三方数据源。
  - 支持按时间窗口回查 9:15-9:20、9:20-9:30 的全部价格记录。
  - 与兼容采样模式并存，并在页面上区分可信度。
- 历史监控记录：
  - 保存每天 9:20 初始候选池、移除记录、9:30 最终结果。
  - 保存每天涨停压力位扫描结果。
  - 支持按日期回放。
- 外部推送：
  - 企业微信、Telegram、邮件、浏览器通知。
  - 推送需要去重、静默窗口和失败重试。
- 更完整的封板质量：
  - 买一量、封单金额、开板/回封次数。
  - 结合盘口字段时标记数据源可信度。
- 多数据源仲裁：
  - 对实时价、昨收价、涨停价、历史 K 线建立 source priority。
  - 出现冲突时保留差异并展示主源选择原因。

## 12. 推荐实施顺序

建议按以下顺序推进，每一步都能产生可验证结果：

1. 搭建 `a-monitor` Next.js 骨架。
2. 迁移股票池和行情快照能力。
3. 建立 `/api/monitor/status`，确认实时行情链路可用。
4. 实现涨停价规则和涨停识别。
5. 接入历史 K 线，完成涨停压力位推荐。
6. 实现涨停压力位页面与筛选。
7. 实现竞价固定价采样状态机。
8. 实现竞价固定价页面与提醒。
9. 补齐 Docker、README、健康检查和部署说明。
10. 盘中实测并根据真实行情接口表现调整缓存、频率和错误提示。

## 13. 一期完成定义

一期可以认为完成，当满足以下条件：

- `a-monitor` 是独立可运行、可部署的 Next.js 项目。
- 服务端统一采集全市场行情，前端不直接抓公开行情源。
- 涨停压力位推荐可用，并明确标记历史数据模式。
- 竞价固定价兼容采样模式可用，并明确标记采样风险。
- 页面具备两个监控 Tab、统计区、表格、筛选、错误状态和数据源状态。
- README 清楚说明公开接口限制、Serverless 限制和二期严格模式方向。

