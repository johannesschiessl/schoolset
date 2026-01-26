import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getStoredPassword, isEditor } from "../lib/auth";
import { cn } from "../lib/cn";
import { ReportItemCard } from "./ReportItemCard";
import { ReportItemEditor } from "./ReportItemEditor";
import { ReportPrintView } from "./ReportPrintView";
import { PlusIcon, DownloadIcon, FileTextIcon } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ReportViewProps {
  month: string;
}

const GERMAN_MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  return `${GERMAN_MONTHS[monthIndex]} ${year}`;
}

export function ReportView({ month }: ReportViewProps) {
  const password = getStoredPassword() ?? "";
  const canEdit = isEditor();

  const report = useQuery(api.reports.getByMonth, { password, month });
  const createReport = useMutation(api.reports.create);
  const items = useQuery(
    api.reportItems.listByReport,
    report ? { password, reportId: report._id } : "skip",
  );

  const createItem = useMutation(api.reportItems.create);
  const updateItem = useMutation(api.reportItems.update);
  const reorderItem = useMutation(api.reportItems.reorder);
  const removeItem = useMutation(api.reportItems.remove);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [editingItem, setEditingItem] = useState<{
    _id: string;
    date: string;
    subject: string;
    description: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const handleCreateReport = async () => {
    await createReport({ password, month });
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setEditorKey((k) => k + 1);
    setEditorOpen(true);
  };

  const handleEditItem = (item: {
    _id: string;
    date: string;
    subject: string;
    description: string;
  }) => {
    setEditingItem(item);
    setEditorKey((k) => k + 1);
    setEditorOpen(true);
  };

  const handleSaveItem = async (data: {
    date: string;
    subject: string;
    description: string;
  }) => {
    if (!report) return;

    if (editingItem) {
      await updateItem({
        password,
        itemId: editingItem._id as any,
        date: data.date,
        subject: data.subject,
        description: data.description,
      });
    } else {
      await createItem({
        password,
        reportId: report._id,
        date: data.date,
        subject: data.subject,
        description: data.description,
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm("Diesen Eintrag löschen?")) {
      await removeItem({ password, itemId: itemId as any });
    }
  };

  const handleMoveItem = async (itemId: string, direction: "up" | "down") => {
    if (!items) return;
    const item = items.find((i) => i._id === itemId);
    if (!item) return;

    const newOrder =
      direction === "up"
        ? Math.max(0, item.order - 1)
        : Math.min(items.length - 1, item.order + 1);

    if (newOrder !== item.order) {
      await reorderItem({ password, itemId: itemId as any, newOrder });
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current || !items) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate scaling to fit width
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      // Handle multi-page if content is too long
      let heightLeft = scaledHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;

      // Additional pages if needed
      while (heightLeft > 0) {
        position = position - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`taetigkeitsbericht-${month}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF-Export fehlgeschlagen");
    } finally {
      setIsExporting(false);
    }
  };

  const monthLabel = formatMonth(month);

  // Report doesn't exist yet
  if (report === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <FileTextIcon className="size-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            {monthLabel}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            Kein Bericht für diesen Monat vorhanden
          </p>
          {canEdit && (
            <button
              onClick={() => {
                void handleCreateReport();
              }}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm",
                "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
                "transition-colors",
              )}
            >
              Bericht erstellen
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading
  if (report === undefined || items === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-neutral-500 dark:text-neutral-400">Laden...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => {
                void handleExportPDF();
              }}
              disabled={isExporting}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm",
                "bg-neutral-100 dark:bg-neutral-800",
                "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                "text-neutral-700 dark:text-neutral-300",
                "flex items-center gap-2",
                "transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <DownloadIcon className="size-4" />
              {isExporting ? "Exportiere..." : "PDF exportieren"}
            </button>
          )}
          {canEdit && (
            <button
              onClick={handleAddItem}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm",
                "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
                "flex items-center gap-2",
                "transition-colors",
              )}
            >
              <PlusIcon className="size-4" />
              Eintrag hinzufügen
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <FileTextIcon className="size-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Noch keine Einträge für diesen Monat
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <ReportItemCard
              key={item._id}
              item={item}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onEdit={() => handleEditItem(item)}
              onDelete={() => {
                void handleDeleteItem(item._id);
              }}
              onMoveUp={() => {
                void handleMoveItem(item._id, "up");
              }}
              onMoveDown={() => {
                void handleMoveItem(item._id, "down");
              }}
            />
          ))}
        </div>
      )}

      {/* Editor modal */}
      <ReportItemEditor
        key={editorKey}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={(data) => {
          void handleSaveItem(data);
        }}
        initialData={editingItem || undefined}
        month={month}
      />

      {/* Hidden print view for PDF export */}
      <div className="fixed left-[-9999px] top-0">
        <ReportPrintView
          ref={printRef}
          month={month}
          monthLabel={monthLabel}
          items={items}
        />
      </div>
    </div>
  );
}
