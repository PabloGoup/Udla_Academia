import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

const STORAGE_BUCKET = "academia-media";

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

export async function uploadAcademicImage(
  file: File,
  folder: "recipes" | "menu",
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no esta configurado para subir imagenes." };
  }

  const extension = file.name.split(".").pop() ?? "jpg";
  const baseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
  const path = `${folder}/${Date.now()}-${baseName}.${extension}`;

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return { ok: true, url: data.publicUrl };
}

export function getAcademicStorageBucketName() {
  return STORAGE_BUCKET;
}
