'use client'

import dynamic from 'next/dynamic'

// chỉ load BasicTab trên client (ssr disabled)
const BasicTab = dynamic(
  () => import('@/components/BasicTab'),
  { ssr: false }
)

export default BasicTab
