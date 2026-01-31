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
                            paddingLeft: "20px",
                            listStyleType: "disc",
                          }}
                        >
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol
                          style={{
                            margin: "6px 0",
                            paddingLeft: "20px",
                            listStyleType: "decimal",
                          }}
                        >
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li style={{ margin: "3px 0" }}>{children}</li>
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
                          {/* Show URL if link text differs from href */}
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
