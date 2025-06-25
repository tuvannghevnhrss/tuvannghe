// src/components/FeatureSection.tsx
import Link from 'next/link';
import { FaBrain, FaChartBar, FaRegLightbulb, FaRobot } from 'react-icons/fa';

const features = [
  { title: 'MBTI Quiz', href: '/mbti', icon: <FaBrain size={32} /> },
  { title: 'Holland Quiz', href: '/holland', icon: <FaChartBar size={32} /> },
  { title: 'Giá trị bản thân', href: '/knowdell', icon: <FaRegLightbulb size={32} /> },
  { title: 'Chat AI', href: '/chat', icon: <FaRobot size={32} /> },
];

export default function FeatureSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Các dịch vụ của chúng tôi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <Link key={f.href} href={f.href}>
              <div className="p-6 bg-gray-50 rounded-lg text-center hover:shadow-lg transition">
                <div className="mx-auto text-blue-600 mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold">{f.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
