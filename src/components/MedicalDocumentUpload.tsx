import { useState } from 'react'
import { supabase } from '@/lib/supabaseStorage'
import { uploadFile, getPublicUrl, deleteFile } from '@/lib/supabaseStorage'

interface Document {
  id: string
  fileName: string
  fileUrl: string
  uploadedAt: string
  documentType: string
}

export const MedicalDocumentUpload = ({ userId }: { userId: string }) => {
  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('prescription')
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)

  // Upload document
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      alert('Please select a file')
      return
    }

    setUploading(true)
    try {
      // Log auth/session info to help debug RLS issues
      try {
        const session = await supabase.auth.getSession()
        const { data: authUser } = await supabase.auth.getUser()
        console.log('Supabase session:', session)
        console.log('Auth user id:', authUser?.user?.id, 'component userId prop:', userId)
      } catch (logErr) {
        console.warn('Could not read supabase auth session:', logErr)
      }

      // Create file path
      const ext = file.name.split('.').pop()
      const safeBase = file.name
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-\.]/g, '')
      const fileName = `doc_${Date.now()}_${safeBase}`
      const filePath = `${userId}/${documentType}/${fileName}`

      // Upload via serverless edge function (service-role) to avoid client RLS issues
      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // result is like data:<mime>;base64,AAA...
          const b = result.split(',')[1]
          resolve(b)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64 = await toBase64(file)

      const { data: resData, error: funcError } = await supabase.functions.invoke('upload-medical-document', {
        body: {
          base64,
          fileName: file.name,
          documentType,
          userId,
        },
      })

      if (funcError) throw funcError

      alert('Document uploaded successfully!')
      setFile(null)
      setDocumentType('prescription')
      loadDocuments()
    } catch (error) {
      console.error('Upload error:', error)
      // Provide clearer guidance for RLS failures
      const msg = (error as any)?.message || String(error)
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('violates row-level')) {
        alert('Upload failed due to database security policy (RLS). Ensure the medical_documents table and policies allow this user to insert. See app docs.')
      } else {
        alert('Upload failed: ' + msg)
      }
    } finally {
      setUploading(false)
    }
  }

  // Load user's documents
  const loadDocuments = async () => {
    setLoading(true)
    try {
      // Cast to any - medical_documents table not in generated types yet
      const { data, error } = await (supabase as any)
        .from('medical_documents')
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      setDocuments(
        data?.map((doc: any) => ({
          id: doc.id,
          fileName: doc.file_name,
          fileUrl: doc.file_url,
          uploadedAt: new Date(doc.uploaded_at).toLocaleDateString(),
          documentType: doc.document_type,
        })) || []
      )
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Delete document
  const handleDelete = async (document: Document) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return

    try {
      // Get file path from database (cast to any - table not in generated types)
      const { data, error: fetchError } = await (supabase as any)
        .from('medical_documents')
        .select('file_path')
        .eq('id', document.id)
        .single()

      if (fetchError) throw fetchError

      // Delete from storage
      await deleteFile('medical-documents', data.file_path)

      // Delete from database (cast to any - table not in generated types)
      const { error: deleteError } = await (supabase as any)
        .from('medical_documents')
        .delete()
        .eq('id', document.id)

      if (deleteError) throw deleteError

      alert('Document deleted successfully!')
      loadDocuments()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed: ' + (error as Error).message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Medical Documents</h2>

      {/* Upload Form */}
      <form onSubmit={handleUpload} className="mb-8 p-4 bg-gray-50 rounded border border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="prescription">Prescription</option>
              <option value="test-report">Test Report</option>
              <option value="vaccination">Vaccination Record</option>
              <option value="medical-history">Medical History</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={uploading}
              className="w-full p-2 border rounded"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <p className="text-xs text-gray-500 mt-1">Accepted: PDF, JPG, PNG, DOC, DOCX</p>
          </div>

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium disabled:bg-gray-400 hover:bg-blue-700 transition"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </form>

      {/* Documents List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Documents</h3>
          <button
            onClick={loadDocuments}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-center text-gray-500">No documents uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <p className="font-medium">{doc.fileName}</p>
                  <p className="text-sm text-gray-500">
                    {doc.documentType} • {doc.uploadedAt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
