'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';     // ✅ Đúng gói
import DailyIframe from '@daily-co/daily-js';
import { useWhisper } from 'use-whisper';

export default function Room() {
  // useParams giờ đã hoạt động bình thường
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLDivElement>(null);

  /* Check API key xem có load chưa */
  console.log('NEXT_PUBLIC_OPENAI_API_KEY =', process.env.NEXT_PUBLIC_OPENAI_API_KEY);

  const { startRecording, stopRecording, transcript } = useWhisper({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? '',
  });

  /* 1) Lấy dữ liệu & join phòng ------------------------------------------- */
  useEffect(() => {
    (async () => {
      const data = await fetch(`/api/interview/getSession?id=${id}`).then(r => r.json());

      const callFrame = DailyIframe.createFrame(videoRef.current!, {
        showLeaveButton: true,
      });
      await callFrame.join({ url: data.url });
    })();
  }, [id]);

  return <div ref={videoRef} className="h-full w-full" />;
}
