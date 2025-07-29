async function send(msg: string, thread?: string) {
  await fetch('/api/chat', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },   // ✅ BẮT BUỘC
    body   : JSON.stringify({ message: msg, thread_id: thread }),
  });
}
