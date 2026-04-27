import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";

type ExcelDownloadEmailProps = {
  schoolName: string;
  teacherName: string;
  classroom: string; // e.g., "XII RPL 1"
  downloadUrl: string;
  currentTime: string;
};

export default function ExcelDownloadEmail({
  schoolName,
  teacherName,
  classroom,
  downloadUrl,
  currentTime,
}: ExcelDownloadEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Text style={styles.hidden}>{currentTime}</Text>
          <Section style={styles.header}>
            <Text style={styles.headerTitle}>{schoolName}</Text>
            <Text style={styles.headerSubtitle}>Data Management Assistant</Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            <Text style={styles.greeting}>
              Hello <strong>{teacherName}</strong>,
            </Text>

            <Text style={styles.message}>
              We have prepared the student data entry template for class{" "}
              <strong>{classroom}</strong>. You can use this file to update
              student marks.
            </Text>

            {/* Action Button */}
            <Section style={styles.actionSection}>
              <Link href={downloadUrl} style={styles.button}>
                Download Template
              </Link>
            </Section>

            <Hr style={styles.divider} />

            <Text style={styles.footerNote}>
              <strong>Note:</strong> Please do not modify the{" "}
              <strong>Student ID</strong> or <strong>UUID</strong> columns, as
              the system needs these to identify the correct records during
              upload.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} | {schoolName} Admin Portal
            </Text>
            {/* Move the unique ID here, hidden */}
            <div style={styles.hidden}>ID: {currentTime}</div>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  hidden: {
    display: "none",
    fontSize: "1px",
    color: "#ffffff",
    lineHeight: "1px",
    maxHeight: "0px",
    maxWidth: "0px",
    opacity: 0,
    overflow: "hidden",
  },
  body: {
    backgroundColor: "#f3f4f6",
    fontFamily: "Inter, -apple-system, sans-serif",
    padding: "20px",
  },
  container: {
    maxWidth: "580px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  header: {
    backgroundColor: "#1e1b4b", // Dark Indigo
    padding: "32px",
    textAlign: "center" as const,
    borderRadius: "8px 8px 0 0",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0",
  },
  headerSubtitle: {
    color: "#c7d2fe",
    fontSize: "12px",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
    marginTop: "8px",
  },
  content: {
    padding: "40px",
  },
  greeting: {
    fontSize: "16px",
    color: "#111827",
    marginBottom: "16px",
  },
  message: {
    fontSize: "15px",
    color: "#4b5563",
    lineHeight: "24px",
  },
  instructionBox: {
    margin: "24px 0",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    border: "1px solid #f3f4f6",
  },
  instructionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "8px",
  },
  instructionStep: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "4px 0",
  },
  actionSection: {
    textAlign: "center" as const,
    margin: "32px 0",
  },
  button: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "12px 30px",
    borderRadius: "5px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "15px",
    display: "inline-block",
  },
  divider: {
    borderColor: "#e5e7eb",
    margin: "32px 0",
  },
  footerNote: {
    fontSize: "13px",
    color: "#9ca3af",
    lineHeight: "20px",
  },
  footer: {
    padding: "24px",
    textAlign: "center" as const,
  },
  footerText: {
    fontSize: "12px",
    color: "#9ca3af",
  },
};
