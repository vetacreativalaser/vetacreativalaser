import { supabase } from './supabaseClient';

export const getDownloadURL = async (bucket, path) => {
  const { data } = await supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
};

export const uploadIsaacImage = async (blob) => {
  const { error } = await supabase.storage
    .from('imgisaac')
    .upload('perfil.webp', blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/webp',
    });

  if (error) throw error;
};
