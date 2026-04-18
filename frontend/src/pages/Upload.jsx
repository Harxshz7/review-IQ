import UploadPanel from '../components/UploadPanel'

export default function Upload() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-syne font-bold text-text-primary">Upload Reviews</h1>
        <p className="text-sm text-text-muted mt-1">
          Upload CSV/JSON files or paste review text. ReviewIQ will automatically detect columns,
          clean data, translate languages, and run AI-powered analysis.
        </p>
      </div>
      <UploadPanel />
    </div>
  )
}
