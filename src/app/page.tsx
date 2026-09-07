import { Activity, BarChart3, Clock3 } from "lucide-react";

const monitorTabs = [
  {
    name: "竞价固定价",
    status: "待接入采样状态机",
    description: "9:15-9:20 采集固定价候选，9:20-9:30 按采样剔除波动股票。",
  },
  {
    name: "涨停压力位",
    status: "待接入涨停识别",
    description: "识别触及涨停个股，结合近 3 个月收盘价判断上方压力。",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">A Monitor</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">A 股监控工作台</h1>
            </div>
            <div className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <Activity className="size-4 text-brand" />
              行情内核待初始化
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8">
        <aside className="border border-border bg-card p-3">
          <div className="flex items-center gap-2 px-2 py-2 text-sm font-semibold">
            <Clock3 className="size-4 text-brand" />
            监控模块
          </div>
          <div className="mt-2 space-y-2">
            {monitorTabs.map((tab, index) => (
              <button
                key={tab.name}
                type="button"
                className="flex w-full flex-col items-start border border-border bg-background px-3 py-3 text-left transition-colors first:border-brand first:bg-brand/10 hover:border-brand/60"
              >
                <span className="text-sm font-semibold">{tab.name}</span>
                <span className="mt-1 text-xs text-muted-foreground">{index === 0 ? "当前默认" : tab.status}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="size-4 text-brand" />
              推进状态
            </div>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {monitorTabs.map((tab) => (
              <article key={tab.name} className="border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold">{tab.name}</h2>
                  <span className="shrink-0 border border-border px-2 py-1 text-xs text-muted-foreground">
                    {tab.status}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{tab.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
