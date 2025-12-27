import { MedicalDocumentUpload } from '@/components/MedicalDocumentUpload'
import { useAuth } from '@/contexts/AuthContext'

/**
 * EXAMPLE: How to use the Medical Document Upload Component
 * 
 * This example shows:
 * 1. Upload medical documents (prescriptions, test reports, etc.)
 * 2. Store files in Supabase Storage
 * 3. Save metadata in database
 * 4. View, download, and delete documents
 */

export const DocumentManagementPage = () => {
  const { user } = useAuth()

  if (!user) {
    return <div>Please log in to manage documents</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <MedicalDocumentUpload userId={user.id} />
    </div>
  )
}

/**
 * EXAMPLE: Fetching documents from Supabase
 */
export const fetchUserDocuments = async (userId: string) => {
  const { supabase } = await import('@/lib/supabaseStorage')
  
  const { data, error } = await supabase
    .from('medical_documents')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }

  return data
}

/**
 * EXAMPLE: Sending a document URL via email or notification
 */
export const sendDocumentNotification = async (
  userId: string,
  documentId: string,
  recipientEmail: string
) => {
  const { supabase } = await import('@/lib/supabaseStorage')
  
  // Get document
  const { data: document, error } = await supabase
    .from('medical_documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching document:', error)
    return
  }

  // In a real app, send via email/SMS using edge function
  console.log(`Sending document ${document.file_name} to ${recipientEmail}`)
  console.log(`Download link: ${document.file_url}`)

  // Call your email edge function here
  // await sendEmailWithDocument(recipientEmail, document)
}

/**
 * EXAMPLE: Upload profile picture
 */
export const uploadProfilePicture = async (userId: string, file: File) => {
  const { uploadFile, getPublicUrl } = await import('@/lib/supabaseStorage')
  const { supabase } = await import('@/lib/supabaseStorage')
  
  try {
    // Upload file
    const fileName = `profile_${userId}.jpg`
    await uploadFile('user-profiles', fileName, file)

    // Get public URL
    const fileUrl = getPublicUrl('user-profiles', fileName)

    // Update user profile
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: fileUrl })
      .eq('id', userId)

    if (error) throw error

    return fileUrl
  } catch (error) {
    console.error('Profile picture upload error:', error)
    throw error
  }
}

/**
 * EXAMPLE: Get all documents of a specific type
 */
export const getDocumentsByType = async (userId: string, documentType: string) => {
  const { supabase } = await import('@/lib/supabaseStorage')
  
  const { data, error } = await supabase
    .from('medical_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('document_type', documentType)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return []
  }

  return data
}
