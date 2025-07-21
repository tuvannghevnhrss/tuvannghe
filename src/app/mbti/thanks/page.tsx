import { Suspense } from 'react';
import ThankScreen from './ThankScreen';

export default function MbtiThanksPage(){
  return <Suspense fallback={<div className="h-screen flex items-center justify-center">Đang tải…</div>}>
    <ThankScreen/>
  </Suspense>;
}
