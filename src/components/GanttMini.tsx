"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

/* dữ liệu nhận từ PlanTab */
export interface Action {
  id: string;
  what: string;
  done: boolean;
}

export default function GanttMini({ actions }: { actions: Action[] }) {
  if (!actions.length)
    return (
      <p className="text-sm italic text-gray-500">
        Chưa đủ dữ liệu để vẽ tiến độ.
      </p>
    );

  /* ---------- gom theo trạng thái ---------- */
  const doneCnt  = actions.filter(a => a.done).length;
  const todoCnt  = actions.length - doneCnt;

  const data = [
    { name: "Hoàn thành", value: doneCnt, color: "#6366f1" },
    { name: "Chưa",       value: todoCnt, color: "#d1d5db" },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} />
        <Tooltip formatter={(v:any)=>`${v} việc`} />
        <Bar dataKey="value" isAnimationActive={false}>
          {data.map((e, idx) => (
            <Cell key={idx} fill={e.color}/>
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
