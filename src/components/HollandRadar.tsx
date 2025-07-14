"use client";

import {
  RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ResponsiveContainer
} from "recharts";

export default function HollandRadar({
  data,
}: { data: { name: string; score: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis domain={[0, 9]} angle={30} />
        <Radar dataKey="score" fill="#6366f1" fillOpacity={0.6} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
