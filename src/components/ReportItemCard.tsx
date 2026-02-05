import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getUserId } from "../lib/auth";
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
  const canEdit = true;
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div
      className={cn(
        "border border-stone-200 dark:border-stone-800 rounded-xl",
        "bg-white dark:bg-stone-900",
        "overflow-hidden",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="text-xs text-stone-400 dark:text-stone-500 mb-0.5">
            {formatDate(item.date)}
          </div>
          <h3 className="font-medium text-sm text-stone-900 dark:text-stone-100">
            {item.subject}
          </h3>
        </div>

        {canEdit && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-stone-100 dark:hover:bg-stone-800",
                "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400",
                "transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed",
              )}
              title="Nach oben"
            >
              <ChevronUpIcon className="size-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-stone-100 dark:hover:bg-stone-800",
                "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400",
                "transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed",
              )}
              title="Nach unten"
            >
              <ChevronDownIcon className="size-3.5" />
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-stone-100 dark:hover:bg-stone-800",
                "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400",
                "transition-colors",
              )}
              title="Anhang hochladen"
            >
              <PaperclipIcon className="size-3.5" />
            </button>
            <button
              onClick={onEdit}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                "text-stone-300 hover:text-blue-500 dark:text-stone-600 dark:hover:text-blue-400",
                "transition-colors",
              )}
              title="Bearbeiten"
            >
              <PencilIcon className="size-3.5" />
            </button>
            <button
              onClick={onDelete}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-red-50 dark:hover:bg-red-900/20",
                "text-stone-300 hover:text-red-500 dark:text-stone-600 dark:hover:text-red-400",
                "transition-colors",
              )}
              title="Loschen"
            >
              <TrashIcon className="size-3.5" />
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
          <p className="text-stone-400 dark:text-stone-500 italic text-sm">
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
  const userId = getUserId();
  const attachments = useQuery(
    api.reportFiles.listByReportItem,
    userId ? { userId: userId as Id<"users">, reportItemId } : "skip",
  );
  const deleteAttachment = useMutation(
    api.reportFiles.deleteReportAttachment,
  );
  const canEdit = !!userId;

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDelete = async (attachmentId: Id<"reportAttachments">) => {
    if (!userId) return;
    if (confirm("Diesen Anhang loschen?")) {
      await deleteAttachment({ userId: userId as Id<"users">, attachmentId });
    }
  };

  return (
    <div className="px-4 pb-4 border-t border-stone-100 dark:border-stone-800 pt-3">
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
  const iconClass = "size-4 text-stone-400 dark:text-stone-500";
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
  const userId = getUserId();
  const downloadUrl = useQuery(
    api.files.getDownloadUrl,
    userId ? { userId: userId as Id<"users">, storageId: attachment.storageId } : "skip",
  );

  const isImage = attachment.contentType.startsWith("image/");

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg",
        "bg-stone-50 dark:bg-stone-800",
        "border border-stone-200 dark:border-stone-700",
      )}
    >
      {isImage && downloadUrl ? (
        <img
          src={downloadUrl}
          alt={attachment.filename}
          className="w-6 h-6 object-cover rounded"
        />
      ) : (
        <AttachmentIcon contentType={attachment.contentType} />
      )}

      <span className="text-xs text-stone-600 dark:text-stone-400 max-w-28 truncate">
        {attachment.filename}
      </span>

      <div className="flex items-center gap-0.5">
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={attachment.filename}
            className={cn(
              "p-1 rounded",
              "hover:bg-stone-200 dark:hover:bg-stone-700",
              "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300",
            )}
            title="Herunterladen"
          >
            <DownloadIcon className="size-3.5" />
          </a>
        )}

        {canEdit && (
          <button
            onClick={onDelete}
            className={cn(
              "p-1 rounded",
              "sm:opacity-0 sm:group-hover:opacity-100",
              "hover:bg-red-50 dark:hover:bg-red-900/20",
              "text-stone-400 hover:text-red-500",
              "transition-opacity",
            )}
            title="Loschen"
          >
            <TrashIcon className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
