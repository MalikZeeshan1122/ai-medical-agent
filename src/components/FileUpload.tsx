import { useState } from 'react'
import { uploadFile, getPublicUrl } from '@/lib/supabaseStorage'

export const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileUrl, setFileUrl] = useState('')

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    try {
      // Upload file
      const fileName = `${Date.now()}_${file.name}`
      await uploadFile('user-profiles', fileName, file)

      // Get public URL
      const url = getPublicUrl('user-profiles', fileName)
      setFileUrl(url)
      alert('File uploaded successfully!')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Upload File</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={uploading}
          className="border p-2"
        />
        <button
          type="submit"
          disabled={uploading || !file}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {fileUrl && (
        <div className="mt-4">
          <p className="text-green-600">File uploaded!</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            View File
          </a>
        </div>
      )}
    </div>
  )
}
