import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
} from "@react-email/components";

type ResetPasswordOtpEmailProps = {
  schoolName: string;
  userName: string;
  userEmail: string;
  otpCode: string;
  currentYear: number;
  currentTime: Date;
};

export default function ResetPasswordOtpEmail({
  schoolName,
  userName,
  userEmail,
  otpCode,
  currentYear,
  currentTime,
}: ResetPasswordOtpEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.headerTitle}>{schoolName}</Text>
            <Text style={styles.headerSubtitle}>
              Academic Information System
            </Text>
          </Section>

          {/* Content */}
          <Section style={styles.content}>
            <Text style={styles.greeting}>
              Hello, <strong>{userName}</strong>
            </Text>

            <Text style={styles.message}>
              We received a request to reset the password for your account
              registered with the email <strong>{userEmail}</strong>. Please use
              the OTP code below to continue the password reset process.
            </Text>

            {/* OTP */}
            <Section style={styles.otpBox}>
              <Text style={styles.otpLabel}>Your OTP Code</Text>
              <Text style={styles.otpCode}>{otpCode}</Text>
              <Text style={styles.otpValidity}>Valid for 15 minutes</Text>
            </Section>

            <Section style={styles.resetLinkBox}>
              <Text style={styles.resetText}>
                Click the button below to reset your password directly:
              </Text>

              <Link
                href={`http://localhost:3000/reset-password?token=${otpCode}`}
                style={styles.resetButton}
              >
                Reset Password
              </Link>
            </Section>

            {/* Warning */}
            <Section style={styles.warningBox}>
              <Text style={styles.warningText}>
                <strong>Warning:</strong> Do not share this code with anyone,
                including individuals claiming to represent the school. We will
                never ask for your OTP code.
              </Text>
            </Section>

            <Section style={styles.divider} />

            <Text style={styles.infoText}>
              <strong>Did not request this?</strong>
              <br />
              If you did not request a password reset, please ignore this email.
              Your account will remain secure. The OTP code will automatically
              expire in 15 minutes.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {currentYear} {schoolName}. All rights reserved.
            </Text>
            <Text style={styles.footerText}>
              This is an automated email. Please do not reply.
            </Text>
            <Text>{currentTime.toLocaleString()}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#F9FAFB",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    padding: "20px",
  },
  resetLinkBox: {
    textAlign: "center" as const,
    margin: "30px 0",
  },

  resetText: {
    fontSize: "14px",
    color: "#4B5563",
    marginBottom: "15px",
  },

  resetButton: {
    display: "inline-block",
    backgroundColor: "#1E3A8A",
    color: "#FFFFFF",
    padding: "12px 24px",
    borderRadius: "6px",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
  },

  container: {
    maxWidth: "600px",
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#1E3A8A",
    padding: "30px 40px",
    textAlign: "center" as const,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: "24px",
    fontWeight: "600",
    margin: "0",
  },
  headerSubtitle: {
    color: "#E5E7EB",
    fontSize: "14px",
    marginTop: "6px",
  },
  content: {
    padding: "40px",
    color: "#111827",
  },
  greeting: {
    fontSize: "16px",
    marginBottom: "20px",
  },
  message: {
    fontSize: "15px",
    color: "#4B5563",
    lineHeight: "1.7",
  },
  otpBox: {
    backgroundColor: "#F9FAFB",
    border: "2px dashed #E5E7EB",
    borderRadius: "8px",
    padding: "25px",
    textAlign: "center" as const,
    margin: "30px 0",
  },
  otpLabel: {
    fontSize: "13px",
    color: "#6B7280",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    fontWeight: "600",
  },
  otpCode: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#1E3A8A",
    letterSpacing: "8px",
    fontFamily: "Courier New, monospace",
    margin: "10px 0",
  },
  otpValidity: {
    fontSize: "13px",
    color: "#DC2626",
    fontWeight: "500",
  },
  warningBox: {
    backgroundColor: "#FEF3C7",
    borderLeft: "4px solid #FBBF24",
    padding: "15px 20px",
    margin: "25px 0",
  },
  warningText: {
    fontSize: "14px",
    color: "#92400E",
    margin: "0",
  },
  divider: {
    height: "1px",
    backgroundColor: "#E5E7EB",
    margin: "30px 0",
  },
  infoText: {
    fontSize: "14px",
    color: "#6B7280",
    lineHeight: "1.6",
  },
  footer: {
    backgroundColor: "#F9FAFB",
    padding: "25px 40px",
    textAlign: "center" as const,
    borderTop: "1px solid #E5E7EB",
  },
  footerText: {
    fontSize: "13px",
    color: "#6B7280",
    margin: "5px 0",
  },
};
