import React from 'react';
import { notFound } from 'next/navigation';
import HuongNghiepCap3 from '../notebooks/HuongNghiepCap3';
import CachXacDinhNghe from '../notebooks/CachXacDinhNghe';

interface Props {
  params: { slug: string };
}

export default function PostPage({ params }: Props) {
  const { slug } = params;
  let ContentComponent: React.FC;

  switch (slug) {
    case 'huong-nghiep-cap-3':
      ContentComponent = HuongNghiepCap3;
      break;
    case 'cach-xac-dinh-nghe':
      ContentComponent = CachXacDinhNghe;
      break;
    default:
      return notFound();
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <ContentComponent />
    </main>
  );
}