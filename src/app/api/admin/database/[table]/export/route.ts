import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/requireAdmin";
import { exportTableCsv, isExplorerTable } from "@/lib/admin/services/databaseExplorer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ table: string }> }) {
  const auth = await requireAdmin("database", "view");
  if (auth.error) return auth.error;

  const { table } = await params;
  if (!isExplorerTable(table)) return NextResponse.json({ error: { code: "INVALID_TABLE" } }, { status: 404 });

  try {
    const csv = await exportTableCsv(table, auth.admin);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${table}.csv"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: { code: "EXPORT_FAILED", message: err instanceof Error ? err.message : "" } }, { status: 500 });
  }
}
