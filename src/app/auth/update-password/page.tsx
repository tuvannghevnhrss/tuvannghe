import { Suspense } from "react";
import UpdatePasswordClient from "./update-password-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <UpdatePasswordClient />
    </Suspense>
  );
}
