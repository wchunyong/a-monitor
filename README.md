# A Monitor

A Monitor 是面向 A 股盘中盯盘的监控工具，第一阶段聚焦两个工作流：

- 集合竞价固定价兼容采样监控。
- 涨停股近 3 个月收盘压力位推荐。

项目 Roadmap 见 `docs/roadmap-market-monitoring.md`，PRD 见 `docs/prd-market-monitoring.md`。

## 开发命令

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 数据提示

一期优先使用公开行情接口和服务端内存缓存。竞价固定价先实现兼容采样模式，只能证明采样点价格未变化，不能证明采样点之间没有波动。
