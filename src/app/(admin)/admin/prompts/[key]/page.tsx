import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin/getAdminUser";
import { can } from "@/lib/admin/permissions";
import { getPromptVersions } from "@/lib/admin/services/prompts";
import PromptDetailClient from "@/components/admin/prompts/PromptDetailClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ key: string }> };

export default async function AdminPromptDetailPage({ params }: Props) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = user ? await getAdminUser(supabase, user) : null;
  if (!admin || !can(admin.role, "prompts", "view")) notFound();

  const { key } = await params;
  const decodedKey = decodeURIComponent(key);
  const versions = await getPromptVersions(decodedKey);
  if (versions.length === 0) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/prompts" className="text-sm text-slate-500 hover:text-slate-800">
        ← Quản lý Prompt
      </Link>
      <h1 className="mt-2 font-mono text-2xl font-bold text-slate-900">{decodedKey}</h1>
      <p className="mt-1 text-sm text-slate-500">Module: {versions[0].module}</p>

      <div className="mt-6">
        <PromptDetailClient
          promptKey={decodedKey}
          module={versions[0].module}
          initialVersions={versions}
          canEdit={can(admin.role, "prompts", "full")}
        />
      </div>
    </div>
  );
}
