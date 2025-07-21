export default function Thanks() {
  return (
    <main className="mx-auto max-w-lg py-20 text-center space-y-6">
      <h1 className="text-2xl font-bold">🎉 Hoàn thành!</h1>
      <p>
        Cảm ơn bạn đã làm bài MBTI. Kết quả đang được tính toán và lưu vào hồ sơ.
      </p>
      <a
        href="/profile"
        className="inline-block rounded bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
      >
        Xem Hồ sơ Phát triển nghề
      </a>
    </main>
  );
}
