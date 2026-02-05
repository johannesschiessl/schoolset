import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getUserId } from "../lib/auth";
import { cn } from "../lib/cn";
import { XIcon, UploadIcon, Loader2Icon } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface ReportFileUploadProps {
  reportItemId: Id<"reportItems">;
  onClose: () => void;
}

export function ReportFileUpload({
  reportItemId,
  onClose,
}: ReportFileUploadProps) {
  const userId = getUserId();
  const generateUploadUrl = useMutation(
    api.reportFiles.generateUploadUrl,
  );
  const saveAttachment = useMutation(
    api.reportFiles.saveReportAttachment,
  );

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !userId) return;

      setUploading(true);
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(`${file.name} wird hochgeladen...`);

          const uploadUrl = await generateUploadUrl({ userId: userId as Id<"users"> });

          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const { storageId } = await response.json();

          await saveAttachment({
            userId: userId as Id<"users">,
            reportItemId,
            storageId,
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          });
        }

        onClose();
      } catch (error) {
        console.error("Upload error:", error);
        alert("Hochladen fehlgeschlagen. Bitte erneut versuchen.");
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    },
    [userId, reportItemId, generateUploadUrl, saveAttachment, onClose],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void handleUpload(e.dataTransfer.files);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-stone-900 p-4 sm:p-6 w-full shadow-xl",
          "sm:rounded-xl sm:max-w-md sm:mx-4",
          "rounded-t-xl",
          "border-t sm:border border-stone-200 dark:border-stone-800",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm text-stone-900 dark:text-stone-100">
            Anhang hochladen
          </h3>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 disabled:opacity-50"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border border-dashed rounded-xl p-6 sm:p-8",
            "flex flex-col items-center justify-center gap-3",
            "cursor-pointer transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600",
            uploading && "pointer-events-none opacity-50",
          )}
        >
          {uploading ? (
            <>
              <Loader2Icon className="size-8 text-stone-400 animate-spin" />
              <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
                {uploadProgress}
              </p>
            </>
          ) : (
            <>
              <div className="p-2.5 rounded-full bg-stone-100 dark:bg-stone-800">
                <UploadIcon className="size-6 text-stone-400 dark:text-stone-500" />
              </div>
              <div className="text-center">
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  <span className="hidden sm:inline">
                    Dateien hierher ziehen oder klicken
                  </span>
                  <span className="sm:hidden">Tippen zum Auswahlen</span>
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                  Bilder, PDFs und Dokumente
                </p>
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => void handleUpload(e.target.files)}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.md"
        />

        <button
          onClick={onClose}
          disabled={uploading}
          className={cn(
            "sm:hidden w-full mt-4 py-3 rounded-lg font-medium text-sm",
            "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
            "disabled:opacity-50",
          )}
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
