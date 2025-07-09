"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

interface Profile {
  mbti: string | null;
  holland: string | null;
  knowdell: string | null;
  hollandScores?: { angle: string; value: number }[];
}

export default function BasicTab({ profile }: { profile: Profile | null }) {
  return (
    <div className="grid grid-cols-2 gap-6 mb-8">
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">MBTI</h2>
        <p className="text-lg">{profile?.mbti ?? "Chưa có dữ liệu"}</p>
      </div>

      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Holland</h2>
        <p className="text-lg">{profile?.holland ?? "Chưa có dữ liệu"}</p>
        {profile?.hollandScores && (
          <RadarChart
            cx={150} cy={100} outerRadius={80}
            width={300} height={200}
            data={profile.hollandScores}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="angle" />
            <PolarRadiusAxis angle={30} domain={[0,5]} />
            <Radar dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          </RadarChart>
        )}
      </div>

      <div className="col-span-2">
        <h3 className="text-lg font-semibold mb-2">Tóm tắt Knowdell</h3>
        <p>{profile?.knowdell ?? "Chưa có dữ liệu"}</p>
      </div>
    </div>
  );
}
