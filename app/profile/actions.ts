"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

function isDicebearUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.hostname !== "api.dicebear.com") return false;
    // Expect path like /9.x/{style}/svg or /png
    if (!u.pathname.startsWith("/9.x/")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function updateProfile(formData: FormData) {
  const session = await api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false, error: "UNAUTHENTICATED" } as const;
  }

  const nameRaw = String(formData.get("name") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();

  if (!nameRaw) {
    return { ok: false, error: "NAME_REQUIRED" } as const;
  }
  if (nameRaw.length > 80) {
    return { ok: false, error: "NAME_TOO_LONG" } as const;
  }

  if (image && !isDicebearUrl(image)) {
    return { ok: false, error: "INVALID_AVATAR" } as const;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: nameRaw,
      image: image || null,
      updatedAt: new Date(),
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { ok: true } as const;
}
