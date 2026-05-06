import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const channelData = months.map((m, i) => ({
  month: m,
  organic: [1200, 1400, 1100, 1800, 2100, 2400, 2800, 3100][i],
  paid: [800, 950, 1200, 1000, 1400, 1600, 1500, 1900][i],
  referral: [400, 380, 460, 520, 480, 600, 710, 650][i],
}));

const pieData = [
  { name: "Organic", value: 42, color: "#6366f1" },
  { name: "Paid", value: 31, color: "#8b5cf6" },
  { name: "Referral", value: 15, color: "#10b981" },
  { name: "Direct", value: 12, color: "#f59e0b" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{ background: "#fff", border: "1px solid #e5e7eb" }}
    >
      <div className="font-semibold text-slate-800 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-slate-500">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          {p.name}:{" "}
          <span className="text-slate-800 font-medium">
            {p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

const RANGES = ["7D", "30D", "90D", "YTD"];
const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
};

export default function AnalyticsPage() {
  const [range, setRange] = useState("30D");
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Analytics</h2>
          <p className="text-sm text-slate-400">
            Traffic and conversion breakdown
          </p>
        </div>
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "#f1f5f9" }}
        >
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                range === r
                  ? { background: "#6366f1", color: "white" }
                  : { color: "#64748b" }
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Visitors", value: "246K", delta: "+22%" },
          { label: "Bounce Rate", value: "38.4%", delta: "-3.2%" },
          { label: "Avg. Duration", value: "4m 32s", delta: "+0:24" },
          { label: "Conversions", value: "9,412", delta: "+8.7%" },
        ].map((m) => (
          <div key={m.label} className="p-4" style={cardStyle}>
            <div className="text-xs text-slate-400 mb-2">{m.label}</div>
            <div className="text-2xl font-bold text-slate-800">{m.value}</div>
            <div className="text-xs text-emerald-600 mt-1 font-medium">
              {m.delta} vs prev period
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 p-5" style={cardStyle}>
          <h3 className="font-semibold text-slate-800 mb-5">
            Traffic by Channel
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={channelData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  color: "#64748b",
                  fontSize: 12,
                  paddingTop: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="organic"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
                name="Organic"
              />
              <Line
                type="monotone"
                dataKey="paid"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                dot={false}
                name="Paid"
              />
              <Line
                type="monotone"
                dataKey="referral"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                name="Referral"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-5" style={cardStyle}>
          <h3 className="font-semibold text-slate-800 mb-5">Traffic Share</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-slate-500">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: d.color }}
                  />
                  {d.name}
                </span>
                <span className="text-slate-800 font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5" style={cardStyle}>
        <h3 className="font-semibold text-slate-800 mb-4">Top Pages</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-slate-400 text-xs uppercase tracking-wider border-b"
                style={{ borderColor: "#f1f5f9" }}
              >
                <th className="pb-3 font-medium">Page</th>
                <th className="pb-3 font-medium text-right">Views</th>
                <th className="pb-3 font-medium text-right">Avg Time</th>
                <th className="pb-3 font-medium text-right">Bounce</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#f8fafc" }}>
              {[
                {
                  page: "/dashboard",
                  views: "48,210",
                  time: "5m 12s",
                  bounce: "24%",
                },
                {
                  page: "/analytics",
                  views: "32,814",
                  time: "6m 04s",
                  bounce: "19%",
                },
                {
                  page: "/pricing",
                  views: "28,640",
                  time: "2m 48s",
                  bounce: "51%",
                },
                {
                  page: "/docs",
                  views: "21,320",
                  time: "8m 31s",
                  bounce: "15%",
                },
                {
                  page: "/blog",
                  views: "17,890",
                  time: "3m 22s",
                  bounce: "44%",
                },
              ].map((row) => (
                <tr
                  key={row.page}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 text-indigo-600 font-mono text-xs">
                    {row.page}
                  </td>
                  <td className="py-3 text-right text-slate-700 font-medium">
                    {row.views}
                  </td>
                  <td className="py-3 text-right text-slate-500">{row.time}</td>
                  <td className="py-3 text-right text-slate-500">
                    {row.bounce}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
