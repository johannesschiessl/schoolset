import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getUserId } from "../lib/auth";
import { cn } from "../lib/cn";
import { ReportItemCard } from "./ReportItemCard";
import { ReportItemEditor } from "./ReportItemEditor";
import { ReportPrintView } from "./ReportPrintView";
import { PlusIcon, DownloadIcon, FileTextIcon } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Id } from "../../convex/_generated/dataModel";

interface ReportViewProps {
  month: string;
}

const GERMAN_MONTHS = [
  "Januar",
  "Februar",
  "Marz",
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
  const userId = getUserId();
  const canEdit = !!userId;

  const report = useQuery(
    api.reports.getByMonth,
    userId ? { userId: userId as Id<"users">, month } : "skip",
  );
  const createReport = useMutation(api.reports.create);
  const items = useQuery(
    api.reportItems.listByReport,
    report && userId ? { userId: userId as Id<"users">, reportId: report._id } : "skip",
  );

  const createItem = useMutation(api.reportItems.create);
  const updateItem = useMutation(api.reportItems.update);
  const reorderItem = useMutation(api.reportItems.reorder);
  const removeItem = useMutation(api.reportItems.remove);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    _id: string;
    date: string;
    subject: string;
    description: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const handleCreateReport = async () => {
    if (!userId) return;
    await createReport({ userId: userId as Id<"users">, month });
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setEditorOpen(true);
  };

  const handleEditItem = (item: {
    _id: string;
    date: string;
    subject: string;
    description: string;
  }) => {
    setEditingItem(item);
    setEditorOpen(true);
  };

  const handleSaveItem = async (data: {
    date: string;
    subject: string;
    description: string;
  }) => {
    if (!report || !userId) return;

    if (editingItem) {
      await updateItem({
        userId: userId as Id<"users">,
        itemId: editingItem._id as Id<"reportItems">,
        date: data.date,
        subject: data.subject,
        description: data.description,
      });
    } else {
      await createItem({
        userId: userId as Id<"users">,
        reportId: report._id,
        date: data.date,
        subject: data.subject,
        description: data.description,
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!userId) return;
    if (confirm("Diesen Eintrag loschen?")) {
      await removeItem({ userId: userId as Id<"users">, itemId: itemId as Id<"reportItems"> });
    }
  };

  const handleMoveItem = async (itemId: string, direction: "up" | "down") => {
    if (!items || !userId) return;
    const item = items.find((i) => i._id === itemId);
    if (!item) return;

    const newOrder =
      direction === "up"
        ? Math.max(0, item.order - 1)
        : Math.min(items.length - 1, item.order + 1);

    if (newOrder !== item.order) {
      await reorderItem({ userId: userId as Id<"users">, itemId: itemId as Id<"reportItems">, newOrder });
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current || !items) return;

    setIsExporting(true);
    try {
      // Wait for all images in the print view to load
      const images = printRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            }),
        ),
      );

      const container = printRef.current;
      const canvasScale = 2;

      const canvas = await html2canvas(container, {
        scale: canvasScale,
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

      // Add clickable link annotations over the rasterized image
      const links = container.querySelectorAll("a[data-link-url]");
      const containerRect = container.getBoundingClientRect();

      links.forEach((link) => {
        const url = link.getAttribute("data-link-url");
        if (!url) return;

        const linkRect = link.getBoundingClientRect();

        const relX = (linkRect.left - containerRect.left) * canvasScale;
        const relY = (linkRect.top - containerRect.top) * canvasScale;
        const relW = linkRect.width * canvasScale;
        const relH = linkRect.height * canvasScale;

        const pdfX = relX * ratio;
        const pdfY = relY * ratio;
        const pdfW = relW * ratio;
        const pdfH = relH * ratio;

        const pageIndex = Math.floor(pdfY / pdfHeight);
        const yOnPage = pdfY - pageIndex * pdfHeight;

        pdf.setPage(pageIndex + 1);
        pdf.link(pdfX, yOnPage, pdfW, pdfH, { url });
      });

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
          <FileTextIcon className="size-14 mx-auto mb-4 text-stone-200 dark:text-stone-700" />
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1.5">
            {monthLabel}
          </h2>
          <p className="text-stone-400 dark:text-stone-500 mb-5 text-sm">
            Kein Bericht fur diesen Monat vorhanden
          </p>
          {canEdit && (
            <button
              onClick={() => void handleCreateReport()}
              className={cn(
                "px-5 py-2.5 rounded-lg font-medium text-sm",
                "bg-stone-900 hover:bg-stone-800 text-white",
                "dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900",
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
        <div className="text-stone-400 dark:text-stone-500 text-sm">Laden...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => void handleExportPDF()}
              disabled={isExporting}
              className={cn(
                "px-3.5 py-2 rounded-lg font-medium text-[13px]",
                "bg-white dark:bg-stone-800",
                "border border-stone-200 dark:border-stone-700",
                "hover:bg-stone-50 dark:hover:bg-stone-700",
                "text-stone-600 dark:text-stone-300",
                "flex items-center gap-2",
                "transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <DownloadIcon className="size-3.5" />
              {isExporting ? "Exportiere..." : "PDF"}
            </button>
          )}
          {canEdit && (
            <button
              onClick={handleAddItem}
              className={cn(
                "px-3.5 py-2 rounded-lg font-medium text-[13px]",
                "bg-stone-900 hover:bg-stone-800 text-white",
                "dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900",
                "flex items-center gap-2",
                "transition-colors",
              )}
            >
              <PlusIcon className="size-3.5" />
              Eintrag
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <FileTextIcon className="size-10 mx-auto mb-3 text-stone-200 dark:text-stone-700" />
          <p className="text-stone-400 dark:text-stone-500 text-sm">
            Noch keine Eintrage fur diesen Monat
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <ReportItemCard
              key={item._id}
              item={item}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onEdit={() => handleEditItem(item)}
              onDelete={() => void handleDeleteItem(item._id)}
              onMoveUp={() => void handleMoveItem(item._id, "up")}
              onMoveDown={() => void handleMoveItem(item._id, "down")}
            />
          ))}
        </div>
      )}

      {/* Editor modal */}
      <ReportItemEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={(data) => void handleSaveItem(data)}
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
