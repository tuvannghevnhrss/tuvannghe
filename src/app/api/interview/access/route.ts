import { NextResponse } from "next/server";
import { requireInterviewUser } from "../_lib/auth";
import { getInterviewAccess } from "../_lib/access";

export async function GET() {
  try {
    const user = await requireInterviewUser();
    const access = await getInterviewAccess(user.id);
    return NextResponse.json(access);
  } catch {
    return NextResponse.json(
      {
        package: null,
        packageName: null,
        limits: { module1: 0, module2: 0, module3: 0 },
        used: { module1: 0, module2: 0, module3: 0 },
        remaining: { module1: 0, module2: 0, module3: 0 },
      },
      { status: 401 }
    );
  }
}
