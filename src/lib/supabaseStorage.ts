import { supabase } from '@/integrations/supabase/client'

// Re-export supabase client for components that import from this file
export { supabase }

// Upload file to storage
export const uploadFile = async (
  bucketName: string,
  filePath: string,
  file: File
) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Download file from storage
export const downloadFile = async (
  bucketName: string,
  filePath: string
) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

// Get public URL for file
export const getPublicUrl = (
  bucketName: string,
  filePath: string
) => {
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath)

  return data.publicUrl
}

// Delete file from storage
export const deleteFile = async (
  bucketName: string,
  filePath: string
) => {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) throw error
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

// List files in bucket
export const listFiles = async (
  bucketName: string,
  path: string = ''
) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path)

    if (error) throw error
    return data
  } catch (error) {
    console.error('List error:', error)
    throw error
  }
}

