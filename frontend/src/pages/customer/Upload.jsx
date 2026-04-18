import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

export default function CustomerUpload() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFiles = (fileList) => {
    const validFiles = Array.from(fileList).filter(file => 
      file.type === 'text/csv' || 
      file.type === 'application/json' ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.json')
    )
    
    if (validFiles.length === 0) {
      setUploadStatus('Please upload CSV or JSON files only')
      return
    }
    
    setFiles(prev => [...prev, ...validFiles])
    setUploadStatus('')
  }

  const handleFileInput = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('Please select files to upload')
      return
    }

    setUploading(true)
    setUploadStatus('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setUploadStatus('Files uploaded successfully!')
      setTimeout(() => {
        navigate('/customer/analysis')
      }, 1500)
    } catch (error) {
      setUploadStatus('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Reviews</h1>
        <p className="text-gray-600">Upload your review files for analysis</p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-lg font-medium text-gray-900">
          Drop your files here, or{' '}
          <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
            browse
            <input
              type="file"
              className="hidden"
              multiple
              accept=".csv,.json"
              onChange={handleFileInput}
            />
          </label>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          CSV and JSON files up to 10MB each
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Files</h3>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          uploadStatus.includes('success') 
            ? 'bg-green-50 text-green-800' 
            : 'bg-red-50 text-red-800'
        }`}>
          {uploadStatus.includes('success') ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p>{uploadStatus}</p>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            files.length === 0 || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">File Format Requirements</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>CSV Format:</strong> Must include columns: review_text, rating, date</p>
          <p><strong>JSON Format:</strong> Array of objects with review_text, rating, date fields</p>
          <p><strong>File Size:</strong> Maximum 10MB per file</p>
          <p><strong>Encoding:</strong> UTF-8 encoded files only</p>
        </div>
      </div>
    </div>
  )
}
