import { supabase } from './supabaseClient';
import imageCompression from 'browser-image-compression';

export const getDownloadURL = async (bucket, path) => {
  const { data } = await supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
};

export const uploadIsaacImage = async (blob) => {
  // Comprimir imagen antes de subir
  const compressedBlob = await imageCompression(blob, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 400,
    useWebWorker: true,
    fileType: 'image/webp'
  });

  const { error} = await supabase.storage
    .from('imgisaac')
    .upload('perfil.webp', compressedBlob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'image/webp',
    });

  if (error) throw error;
};
