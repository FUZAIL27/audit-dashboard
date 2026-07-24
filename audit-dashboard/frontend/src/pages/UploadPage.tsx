import { UploadDropzone } from '@/features/upload/UploadDropzone';

export function UploadPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Upload Logs</h1>
        <p className="mt-1 text-sm text-text-muted">
          Bulk import audit logs from CSV, JSON, or Excel. Invalid rows are skipped and reported —
          the rest of the batch still imports.
        </p>
      </div>
      <UploadDropzone />
    </div>
  );
}
