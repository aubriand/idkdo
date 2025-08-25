import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { api } from "@/app/lib/auth";

export async function PUT(req: NextRequest) {
  const session = await api.getSession({ headers: req.headers });
  if (!session) {
    return new Response(JSON.stringify({ ok: false, error: "UNAUTHENTICATED" }), { status: 401 });
  }
  const formData = await req.formData();
  const name = String(formData.get("name") || "").trim();
  const image = String(formData.get("image") || "").trim();
  if (!name) {
    return new Response(JSON.stringify({ ok: false, error: "NAME_REQUIRED" }), { status: 400 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, image },
  });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
