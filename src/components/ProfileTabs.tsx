'use client'

import { useState } from 'react'
import dynamic       from 'next/dynamic'
import type { Tables } from '@/types/supabase'

/* --- tách các tab thành component con để giảm bundle --- */
const BasicTab    = dynamic(() => import('./tabs/BasicTab'))
const HollandTab  = dynamic(() => import('./tabs/HollandTab'))
const ValueTab    = dynamic(() => import('./tabs/ValueTab'))
const KnowdellTab = dynamic(() => import('./tabs/KnowdellTab'))

export type CareerProfile = Tables<'career_profile'> | null

interface Props {
  initialTab: 'basic' | 'holland' | 'value' | 'knowdell'
  profile:    CareerProfile
}

export default function ProfileTabs({ initialTab, profile }: Props) {
  const [tab, setTab] = useState(initialTab)

  const TabButton = (id: Props['initialTab'], label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`px-4 py-1 rounded
        ${tab === id ? 'bg-indigo-600 text-white' : 'border'}`}
    >
      {label}
    </button>
  )

  return (
    <>
      {/* thanh chuyển tab */}
      <nav className="flex gap-2 mb-4">
        {TabButton('basic',    'Đặc tính (MBTI)')}
        {TabButton('holland',  'RIASEC')}
        {TabButton('value',    'Giá trị bản thân')}
        {TabButton('knowdell', 'Knowdell Card Sort')}
      </nav>

      {/* nội dung từng tab */}
      {tab === 'basic'    && <BasicTab    profile={profile} />}
      {tab === 'holland'  && <HollandTab  profile={profile} />}
      {tab === 'value'    && <ValueTab    profile={profile} />}
      {tab === 'knowdell' && <KnowdellTab profile={profile} />}
    </>
  )
}
