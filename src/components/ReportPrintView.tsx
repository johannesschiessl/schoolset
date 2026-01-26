import { forwardRef } from "react";
import ReactMarkdown from "react-markdown";

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
          color: "#000000",
          padding: "32px",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
            paddingBottom: "16px",
            borderBottom: "2px solid #d4d4d4",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "8px",
              margin: "0 0 8px 0",
            }}
          >
            Tätigkeitsbericht
          </h1>
          <p style={{ fontSize: "18px", color: "#525252", margin: 0 }}>
            {monthLabel}
          </p>
        </div>

        {/* Items */}
        <div>
          {items.map((item, index) => (
            <div
              key={item._id}
              style={{
                pageBreakInside: "avoid",
                marginBottom: index < items.length - 1 ? "24px" : 0,
              }}
            >
              <div
                style={{
                  borderLeft: "4px solid #3b82f6",
                  paddingLeft: "16px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ fontSize: "14px", color: "#737373" }}>
                  {formatDate(item.date)}
                </div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    margin: 0,
                  }}
                >
                  {item.subject}
                </h2>
              </div>
              {item.description && (
                <div
                  style={{
                    paddingLeft: "16px",
                    fontSize: "14px",
                    lineHeight: "1.6",
                  }}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p style={{ margin: "8px 0" }}>{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul
                          style={{
                            margin: "8px 0",
                            paddingLeft: "24px",
                            listStyleType: "disc",
                          }}
                        >
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol
                          style={{
                            margin: "8px 0",
                            paddingLeft: "24px",
                            listStyleType: "decimal",
                          }}
                        >
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li style={{ margin: "4px 0" }}>{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ fontWeight: 600 }}>{children}</strong>
                      ),
                      code: ({ children }) => (
                        <code
                          style={{
                            backgroundColor: "#f3f4f6",
                            padding: "2px 4px",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        >
                          {children}
                        </code>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          style={{
                            color: "#2563eb",
                            textDecoration: "underline",
                          }}
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {item.description}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "32px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e5e5",
            fontSize: "14px",
            color: "#737373",
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
