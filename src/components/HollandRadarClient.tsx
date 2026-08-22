"use client";
import dynamic from "next/dynamic";

const HollandRadar = dynamic(() => import("./HollandRadar"), {
  ssr: false,
  loading: () => <div className="mx-auto h-48 w-48 animate-pulse rounded-full bg-gray-100" />,
});

export default HollandRadar;
