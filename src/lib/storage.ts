import { supabase } from '@/lib/supabase'

type PrivateBucket = 'lesson-videos' | 'materials'
type Bucket = PrivateBucket | 'module-covers'

export async function getSignedUrl(bucket: PrivateBucket, path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60)
  if (error) throw error
  return data.signedUrl
}

export function getPublicUrl(bucket: 'module-covers', path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function uploadFile(bucket: Bucket, file: File) {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  return path
}

export async function removeFile(bucket: Bucket, path: string) {
  await supabase.storage.from(bucket).remove([path])
}
