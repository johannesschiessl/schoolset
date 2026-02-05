import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getUserId, isEditor } from "../lib/auth";
import { cn } from "../lib/cn";
import {
  FileIcon,
  ImageIcon,
  FileTextIcon,
  TrashIcon,
  DownloadIcon,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface AttachmentListProps {
  itemId: Id<"items">;
}

export function AttachmentList({ itemId }: AttachmentListProps) {
  const userId = getUserId();
  const attachments = useQuery(
    api.files.listByItem,
    userId ? { userId: userId as Id<"users">, itemId } : "skip",
  );
  const deleteAttachment = useMutation(api.files.deleteAttachment);
  const canEdit = isEditor();

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDelete = async (attachmentId: Id<"attachments">) => {
    if (!userId) return;
    if (confirm("Diesen Anhang loschen?")) {
      await deleteAttachment({ userId: userId as Id<"users">, attachmentId });
    }
  };

  return (
    <div className="px-3 sm:px-3.5 pb-3 sm:pb-3.5 pl-7 sm:pl-9">
      <div className="flex flex-wrap gap-1.5">
        {attachments.map((attachment) => (
          <AttachmentItem
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

interface AttachmentItemProps {
  attachment: {
    _id: Id<"attachments">;
    storageId: Id<"_storage">;
    filename: string;
    contentType: string;
  };
  onDelete: () => void;
  canEdit: boolean;
}

function AttachmentItem({
  attachment,
  onDelete,
  canEdit,
}: AttachmentItemProps) {
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
      ) : isImage ? (
        <ImageIcon className="size-4 text-stone-400 dark:text-stone-500" />
      ) : attachment.contentType === "application/pdf" || attachment.contentType.includes("text") ? (
        <FileTextIcon className="size-4 text-stone-400 dark:text-stone-500" />
      ) : (
        <FileIcon className="size-4 text-stone-400 dark:text-stone-500" />
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
