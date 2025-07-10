import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* MBTI */}
      <section className="bg-white py-20 text-center">
        <h2 className="text-3xl font-bold mb-3">Trắc nghiệm MBTI</h2>
        <p className="text-gray-600 mb-6">
          Khám phá tính cách của bạn qua 16 câu hỏi trắc nghiệm MBTI.
        </p>
        <Link
          href="/mbti"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition"
        >
          Bắt đầu làm bài
        </Link>
      </section>

      {/* Holland */}
      <section className="bg-gray-50 py-20 text-center">
        <h2 className="text-3xl font-bold mb-3">Trắc nghiệm Holland</h2>
        <p className="text-gray-600 mb-6">
          Khám phá nhóm nghề nghiệp phù hợp với bạn qua trắc nghiệm Holland RIASEC.
        </p>
        <Link
          href="/holland"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full transition"
        >
          Bắt đầu trắc nghiệm
        </Link>
      </section>

      {/* Knowdell */}
      <section className="bg-white py-20 text-center">
        <h2 className="text-3xl font-bold mb-3">Bạn đang mông lung?</h2>
        <p className="text-gray-600 mb-6">
          Khám phá giá trị bản thân để tìm ra hướng đi phù hợp nhất với bạn.
        </p>
        <Link
          href="/knowdell"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full transition"
        >
          Tìm giá trị bản thân
        </Link>
      </section>

      {/* Tin tức placeholder */}
      <section className="bg-gray-50 py-20 text-center">
        <h2 className="text-3xl font-bold mb-8">
          Tin tức nghề nghiệp &amp; phát triển bản thân
        </h2>
        {/* TODO: component NewsSection */}
      </section>
    </>
  );
}
