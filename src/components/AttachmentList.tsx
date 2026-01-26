import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getStoredPassword, isEditor } from "../lib/auth";
import { cn } from "../lib/cn";
import {
  FileIcon,
  ImageIcon,
  FileTextIcon,
  TrashIcon,
  DownloadIcon,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

const iconClassName =
  "size-4 sm:size-5 text-neutral-500 dark:text-neutral-400";

function AttachmentItemIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) {
    return <ImageIcon className={iconClassName} />;
  }
  if (contentType === "application/pdf" || contentType.includes("text")) {
    return <FileTextIcon className={iconClassName} />;
  }
  return <FileIcon className={iconClassName} />;
}

interface AttachmentListProps {
  itemId: Id<"items">;
}

export function AttachmentList({ itemId }: AttachmentListProps) {
  const password = getStoredPassword() ?? "";
  const attachments = useQuery(api.files.listByItem, { password, itemId });
  const deleteAttachment = useMutation(api.files.deleteAttachment);
  const canEdit = isEditor();

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDelete = async (attachmentId: Id<"attachments">) => {
    if (confirm("Delete this attachment?")) {
      await deleteAttachment({ password, attachmentId });
    }
  };

  return (
    <div className="px-3 sm:px-4 pb-3 sm:pb-4 pl-7 sm:pl-9">
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <AttachmentItem
            key={attachment._id}
            attachment={attachment}
            onDelete={() => {
              void handleDelete(attachment._id);
            }}
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
        <AttachmentItemIcon contentType={attachment.contentType} />
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
            title="Download"
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
            title="Delete"
          >
            <TrashIcon className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
