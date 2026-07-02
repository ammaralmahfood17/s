'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

/* ── Custom tooltip style ── */
const tooltipStyle = {
  contentStyle: {
    background: 'hsl(0 0% 100%)',
    border: '1px solid hsl(0 0% 90%)',
    borderRadius: '12px',
    fontSize: '13px',
    direction: 'rtl' as const,
  },
};

/* ── Revenue trend chart ── */
export function RevenueChart({
  data,
}: {
  data: { date: string; total: number }[];
}) {
  if (data.length === 0) return null;

  return (
    <div className="card">
      <h2 className="section-title">الإيرادات — آخر 30 يوم</h2>
      <div className="h-52 sm:h-64 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 92%)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number) => [`${value.toFixed(3)} د.ب`, 'الإيرادات']}
              labelFormatter={(label: string) => new Date(label).toLocaleDateString('ar-BH')}
            />
            <Bar
              dataKey="total"
              fill="hsl(188 100% 17%)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Subscription breakdown (pie) ── */
const PIE_COLORS: Record<string, string> = {
  active:    '#22c55e', // green-500
  trialing:  '#eab308', // yellow-500
  past_due:  '#ef4444', // red-500
  cancelled: '#a1a1aa', // zinc-400
  paused:    '#f97316', // orange-500
  free:      '#06b6d4', // cyan-500
};

const PIE_LABELS: Record<string, string> = {
  active:    'نشط',
  trialing:  'تجريبي',
  past_due:  'متأخر',
  cancelled: 'ملغي',
  paused:    'موقوف',
  free:      'مجاني',
};

export function SubscriptionPie({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const filtered = data.filter(d => d.value > 0);

  if (filtered.length === 0) return null;

  return (
    <div className="card">
      <h2 className="section-title">حالة الاشتراكات</h2>
      <div className="flex flex-col items-center gap-2">
        <div className="h-48 sm:h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filtered}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {filtered.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? '#a1a1aa'} />
                ))}
              </Pie>
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number) => [`${value} اشتراك`, PIE_LABELS[filtered.find(d => d.value === value)?.name ?? ''] ?? '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center">
          {filtered.map(entry => (
            <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: PIE_COLORS[entry.name] ?? '#a1a1aa' }}
              />
              {PIE_LABELS[entry.name] ?? entry.name}: <strong className="text-foreground">{entry.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
