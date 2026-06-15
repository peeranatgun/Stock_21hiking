// storage.js — Supabase Storage helpers
import { supabase } from './supabase.js';

const BUCKET = 'product-images';

export async function uploadProductImage(file) {
  const ext = file.name.split('.').pop();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

export async function deleteProductImage(imageUrl) {
  if (!imageUrl) return;
  const parts = imageUrl.split(`/${BUCKET}/`);
  if (parts.length < 2) return;
  const path = parts[1];
  await supabase.storage.from(BUCKET).remove([path]);
}
