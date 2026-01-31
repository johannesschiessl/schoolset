import { forwardRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getStoredPassword } from "../lib/auth";
import ReactMarkdown from "react-markdown";
import type { Id } from "../../convex/_generated/dataModel";

interface ReportItem {
  _id: string;
  date: string;
  subject: string;
  description: string;
  order: number;
}

interface ReportPrintViewProps {
  month: string;
  monthLabel: string;
  items: ReportItem[];
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

// Using inline styles with hex colors to avoid oklch() which html2canvas doesn't support
export const ReportPrintView = forwardRef<HTMLDivElement, ReportPrintViewProps>(
  ({ monthLabel, items }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: "210mm",
          minHeight: "297mm",
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#ffffff",
          color: "#1a1a1a",
          padding: "40px 48px",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "36px",
            paddingBottom: "20px",
            borderBottom: "1px solid #d4d4d4",
          }}
        >
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "600",
              letterSpacing: "-0.01em",
              margin: "0 0 6px 0",
            }}
          >
            Tätigkeitsbericht
          </h1>
          <p style={{ fontSize: "16px", color: "#737373", margin: 0 }}>
            {monthLabel}
          </p>
        </div>

        {/* Items */}
        <div>
          {items.map((item, index) => (
            <div
              key={item._id}
              data-report-item-id={item._id}
              style={{
                pageBreakInside: "avoid",
                paddingBottom: index < items.length - 1 ? "20px" : 0,
                marginBottom: index < items.length - 1 ? "20px" : 0,
                borderBottom:
                  index < items.length - 1
                    ? "1px solid #e5e5e5"
                    : "none",
              }}
            >
              <div style={{ marginBottom: "4px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999999",
                    marginBottom: "2px",
                    letterSpacing: "0.01em",
                  }}
                >
                  {formatDate(item.date)}
                </div>
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    margin: 0,
                    color: "#1a1a1a",
                  }}
                >
                  {item.subject}
                </h2>
              </div>
              {item.description && (
                <div
                  style={{
                    fontSize: "14px",
                    lineHeight: "1.6",
                    color: "#333333",
                  }}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p style={{ margin: "6px 0" }}>{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul
                          style={{
                            margin: "6px 0",
                            paddingLeft: "0",
                            listStyleType: "none",
                          }}
                        >
                          {children}
                        </ul>
                      ),
                      ol: ({ children, start }) => {
                        let counter = (start ?? 1) - 1;
                        const numbered = Array.isArray(children)
                          ? children.map((child) => {
                              if (
                                child &&
                                typeof child === "object" &&
                                "type" in child &&
                                child.type === "li"
                              ) {
                                counter++;
                                return (
                                  <li
                                    key={counter}
                                    style={{
                                      margin: "3px 0",
                                      display: "flex",
                                      alignItems: "baseline",
                                    }}
                                  >
                                    <span
                                      style={{
                                        minWidth: "20px",
                                        flexShrink: 0,
                                        color: "#333333",
                                      }}
                                    >
                                      {counter}.
                                    </span>
                                    <span style={{ flex: 1 }}>
                                      {child.props.children}
                                    </span>
                                  </li>
                                );
                              }
                              return child;
                            })
                          : children;
                        return (
                          <ol
                            style={{
                              margin: "6px 0",
                              paddingLeft: "0",
                              listStyleType: "none",
                            }}
                          >
                            {numbered}
                          </ol>
                        );
                      },
                      li: ({ children }) => (
                        <li
                          style={{
                            margin: "3px 0",
                            display: "flex",
                            alignItems: "baseline",
                          }}
                        >
                          <span
                            style={{
                              minWidth: "20px",
                              flexShrink: 0,
                              lineHeight: "1.6",
                            }}
                          >
                            •
                          </span>
                          <span style={{ flex: 1 }}>{children}</span>
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ fontWeight: 600, color: "#1a1a1a" }}>
                          {children}
                        </strong>
                      ),
                      code: ({ children }) => (
                        <code
                          style={{
                            backgroundColor: "#f5f5f5",
                            padding: "1px 4px",
                            borderRadius: "3px",
                            fontSize: "13px",
                            color: "#333333",
                          }}
                        >
                          {children}
                        </code>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          data-link-url={href}
                          style={{
                            color: "#1a1a1a",
                            textDecoration: "underline",
                            textDecorationColor: "#999999",
                            textUnderlineOffset: "2px",
                          }}
                        >
                          {children}
                          {href &&
                            typeof children === "string" &&
                            children !== href && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#999999",
                                  marginLeft: "2px",
                                }}
                              >
                                {" "}
                                ({href})
                              </span>
                            )}
                        </a>
                      ),
                    }}
                  >
                    {item.description}
                  </ReactMarkdown>
                </div>
              )}
              <PrintItemAttachments
                reportItemId={item._id as Id<"reportItems">}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "36px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e5e5",
            fontSize: "12px",
            color: "#999999",
            textAlign: "center",
          }}
        >
          Generiert am{" "}
          {new Date().toLocaleDateString("de-DE", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>
    );
  },
);

ReportPrintView.displayName = "ReportPrintView";

function PrintItemAttachments({
  reportItemId,
}: {
  reportItemId: Id<"reportItems">;
}) {
  const password = getStoredPassword() ?? "";
  const attachments = useQuery(api.reportFiles.listByReportItem, {
    password,
    reportItemId,
  });

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: "10px" }}>
      {attachments.map((att) => (
        <PrintAttachment key={att._id} attachment={att} />
      ))}
    </div>
  );
}

function PrintAttachment({
  attachment,
}: {
  attachment: {
    _id: Id<"reportAttachments">;
    storageId: Id<"_storage">;
    filename: string;
    contentType: string;
  };
}) {
  const password = getStoredPassword() ?? "";
  const url = useQuery(api.files.getDownloadUrl, {
    password,
    storageId: attachment.storageId,
  });

  if (!url) return null;

  const isImage = attachment.contentType.startsWith("image/");

  if (isImage) {
    return (
      <div style={{ margin: "8px 0" }}>
        <img
          src={url}
          alt={attachment.filename}
          crossOrigin="anonymous"
          style={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: "4px",
            border: "1px solid #e5e5e5",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ margin: "4px 0" }}>
      <a
        href={url}
        data-link-url={url}
        style={{
          color: "#1a1a1a",
          textDecoration: "underline",
          textDecorationColor: "#999999",
          textUnderlineOffset: "2px",
          fontSize: "13px",
        }}
      >
        {attachment.filename}
      </a>
    </div>
  );
}
