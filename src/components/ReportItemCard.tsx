import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getStoredPassword, isEditor } from "../lib/auth";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/cn";
import {
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PaperclipIcon,
  FileIcon,
  ImageIcon,
  FileTextIcon,
  DownloadIcon,
} from "lucide-react";
import { ReportFileUpload } from "./ReportFileUpload";
import type { Id } from "../../convex/_generated/dataModel";

interface ReportItemCardProps {
  item: {
    _id: string;
    date: string;
    subject: string;
    description: string;
    order: number;
  };
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const GERMAN_WEEKDAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const weekday = GERMAN_WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${weekday}, ${day}.${month}.${year}`;
}

export function ReportItemCard({
  item,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ReportItemCardProps) {
  const canEdit = isEditor();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div
      className={cn(
        "border border-neutral-200 dark:border-neutral-700 rounded-lg",
        "bg-white dark:bg-neutral-800/50",
        "overflow-hidden",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatDate(item.date)}
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {item.subject}
          </h3>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1">
            {/* Reorder buttons */}
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className={cn(
                "p-1.5 rounded",
                "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                "transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed",
              )}
              title="Nach oben"
            >
              <ChevronUpIcon className="size-4" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className={cn(
                "p-1.5 rounded",
                "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                "transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed",
              )}
              title="Nach unten"
            >
              <ChevronDownIcon className="size-4" />
            </button>

            {/* Upload attachment button */}
            <button
              onClick={() => setUploadOpen(true)}
              className={cn(
                "p-1.5 rounded",
                "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                "transition-colors",
              )}
              title="Anhang hochladen"
            >
              <PaperclipIcon className="size-4" />
            </button>

            {/* Edit button */}
            <button
              onClick={onEdit}
              className={cn(
                "p-1.5 rounded",
                "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                "text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400",
                "transition-colors",
              )}
              title="Bearbeiten"
            >
              <PencilIcon className="size-4" />
            </button>

            {/* Delete button */}
            <button
              onClick={onDelete}
              className={cn(
                "p-1.5 rounded",
                "hover:bg-red-100 dark:hover:bg-red-900/30",
                "text-neutral-400 hover:text-red-600 dark:hover:text-red-400",
                "transition-colors",
              )}
              title="Löschen"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {item.description ? (
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown>{item.description}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-neutral-400 dark:text-neutral-500 italic text-sm">
            Keine Beschreibung
          </p>
        )}
      </div>

      {/* Attachments */}
      <ReportAttachmentList
        reportItemId={item._id as Id<"reportItems">}
      />

      {/* Upload modal */}
      {uploadOpen && (
        <ReportFileUpload
          reportItemId={item._id as Id<"reportItems">}
          onClose={() => setUploadOpen(false)}
        />
      )}
    </div>
  );
}

function ReportAttachmentList({
  reportItemId,
}: {
  reportItemId: Id<"reportItems">;
}) {
  const password = getStoredPassword() ?? "";
  const attachments = useQuery(api.reportFiles.listByReportItem, {
    password,
    reportItemId,
  });
  const deleteAttachment = useMutation(
    api.reportFiles.deleteReportAttachment,
  );
  const canEdit = isEditor();

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDelete = async (attachmentId: Id<"reportAttachments">) => {
    if (confirm("Diesen Anhang löschen?")) {
      await deleteAttachment({ password, attachmentId });
    }
  };

  return (
    <div className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-700/50 pt-3">
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <ReportAttachmentItem
            key={attachment._id}
            attachment={attachment}
            onDelete={() => void handleDelete(attachment._id)}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
}

function AttachmentIcon({ contentType }: { contentType: string }) {
  const iconClass = "size-4 sm:size-5 text-neutral-500 dark:text-neutral-400";
  if (contentType.startsWith("image/")) return <ImageIcon className={iconClass} />;
  if (contentType === "application/pdf" || contentType.includes("text"))
    return <FileTextIcon className={iconClass} />;
  return <FileIcon className={iconClass} />;
}

function ReportAttachmentItem({
  attachment,
  onDelete,
  canEdit,
}: {
  attachment: {
    _id: Id<"reportAttachments">;
    storageId: Id<"_storage">;
    filename: string;
    contentType: string;
  };
  onDelete: () => void;
  canEdit: boolean;
}) {
  const password = getStoredPassword() ?? "";
  const downloadUrl = useQuery(api.files.getDownloadUrl, {
    password,
    storageId: attachment.storageId,
  });

  const isImage = attachment.contentType.startsWith("image/");

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg",
        "bg-neutral-100 dark:bg-neutral-700",
        "border border-neutral-200 dark:border-neutral-600",
      )}
    >
      {isImage && downloadUrl ? (
        <img
          src={downloadUrl}
          alt={attachment.filename}
          className="w-6 h-6 sm:w-8 sm:h-8 object-cover rounded"
        />
      ) : (
        <AttachmentIcon contentType={attachment.contentType} />
      )}

      <span className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 max-w-24 sm:max-w-32 truncate">
        {attachment.filename}
      </span>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={attachment.filename}
            className={cn(
              "p-1.5 rounded",
              "hover:bg-neutral-200 dark:hover:bg-neutral-600",
              "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
            )}
            title="Herunterladen"
          >
            <DownloadIcon className="size-4" />
          </a>
        )}

        {canEdit && (
          <button
            onClick={onDelete}
            className={cn(
              "p-1.5 rounded",
              "sm:opacity-0 sm:group-hover:opacity-100",
              "hover:bg-red-100 dark:hover:bg-red-900/30",
              "text-neutral-500 hover:text-red-600",
              "transition-opacity",
            )}
            title="Löschen"
          >
            <TrashIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
