import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getStoredPassword } from "../lib/auth";
import { cn } from "../lib/cn";
import { XIcon, UploadIcon, Loader2Icon } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface FileUploadProps {
  itemId: Id<"items">;
  onClose: () => void;
}

export function FileUpload({ itemId, onClose }: FileUploadProps) {
  const password = getStoredPassword() ?? "";
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveAttachment = useMutation(api.files.saveAttachment);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setUploading(true);
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(`Uploading ${file.name}...`);

          // Get upload URL
          const uploadUrl = await generateUploadUrl({ password });

          // Upload file
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const { storageId } = await response.json();

          // Save attachment record
          await saveAttachment({
            password,
            itemId,
            storageId,
            filename: file.name,
            contentType: file.type || "application/octet-stream",
          });
        }

        onClose();
      } catch (error) {
        console.error("Upload error:", error);
        alert("Upload failed. Please try again.");
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    },
    [password, itemId, generateUploadUrl, saveAttachment, onClose],
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
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-neutral-800 p-4 sm:p-6 w-full shadow-xl",
          "sm:rounded-xl sm:max-w-md sm:mx-4",
          "rounded-t-xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Upload Attachment
          </h3>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 disabled:opacity-50"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-6 sm:p-8",
            "flex flex-col items-center justify-center gap-3",
            "cursor-pointer transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-neutral-300 dark:border-neutral-600 hover:border-blue-400 active:border-blue-500",
            uploading && "pointer-events-none opacity-50",
          )}
        >
          {uploading ? (
            <>
              <Loader2Icon className="size-10 text-blue-500 animate-spin" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                {uploadProgress}
              </p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-700">
                <UploadIcon className="size-8 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <span className="hidden sm:inline">
                    Drop files here or click to browse
                  </span>
                  <span className="sm:hidden">Tap to select files</span>
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Images, PDFs, and documents
                </p>
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.md"
        />

        {/* Mobile cancel button */}
        <button
          onClick={onClose}
          disabled={uploading}
          className={cn(
            "sm:hidden w-full mt-4 py-3 rounded-lg font-medium",
            "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300",
            "active:bg-neutral-200 dark:active:bg-neutral-600",
            "disabled:opacity-50",
          )}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
