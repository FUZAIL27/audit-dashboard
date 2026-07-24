import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useUploadLogs } from '@/hooks/useUploadLogs';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';
import { cn } from '@/utils/cn';

const ACCEPTED_EXTENSIONS = ['.csv', '.json', '.xlsx', '.xls'];

export function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadLogs();
  const { showToast } = useToast();

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setSelectedFile(files[0]);
    upload.reset();
  }, [upload]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleImport = () => {
    if (!selectedFile) return;
    upload.mutate(selectedFile, {
      onSuccess: (summary) => {
        showToast(
          `Import complete: ${summary.insertedCount.toLocaleString()} inserted, ${summary.failedCount} failed`,
          summary.failedCount > 0 ? 'info' : 'success'
        );
      },
      onError: () => showToast('Import failed. Check the file format and try again.', 'error'),
    });
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'glass-panel flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-4 py-10 text-center transition-colors sm:py-16',
          isDragging ? 'border-signal bg-signal/5' : 'border-border hover:border-border-strong'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <UploadCloud size={32} className={cn(isDragging ? 'text-signal' : 'text-text-muted')} />
        <div>
          <p className="text-sm font-medium text-text-primary">
            Drag & drop a file, or click to browse
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Supports CSV, JSON, XLSX — up to 50,000+ rows
          </p>
        </div>
      </div>

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel flex flex-wrap items-center justify-between gap-3 p-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileSpreadsheet size={20} className="text-signal shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm text-text-primary">{selectedFile.name}</p>
              <p className="text-xs text-text-muted">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <Button onClick={handleImport} isLoading={upload.isPending} size="sm">
            Import
          </Button>
        </motion.div>
      )}

      {upload.isPending && (
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">Processing…</span>
            <span className="text-xs text-signal font-mono">{upload.progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-base-700 overflow-hidden">
            <motion.div
              className="h-full bg-signal"
              initial={{ width: 0 }}
              animate={{ width: `${upload.progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {upload.data && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-text-muted">
                <CheckCircle2 size={12} className="text-severity-low" /> Inserted
              </p>
              <p className="mt-1 font-display text-xl text-text-primary">
                {upload.data.insertedCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-text-muted">
                <AlertTriangle size={12} className="text-severity-medium" /> Duplicates
              </p>
              <p className="mt-1 font-display text-xl text-text-primary">
                {upload.data.duplicateCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-text-muted">
                <XCircle size={12} className="text-severity-critical" /> Failed
              </p>
              <p className="mt-1 font-display text-xl text-text-primary">
                {upload.data.failedCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Execution Time</p>
              <p className="mt-1 font-display text-xl text-text-primary">
                {upload.data.executionTimeMs}ms
              </p>
            </div>
          </div>

          {upload.data.invalidSample.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                Sample Failures
              </p>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                {upload.data.invalidSample.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 border-b border-border/60 px-3 py-2 text-xs last:border-b-0"
                  >
                    <span className="text-text-muted shrink-0">Row {item.row}</span>
                    <span className="text-severity-critical">{item.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
