# Student Info App

A comprehensive full-stack Next.js application designed to manage student information, academic records, attendance, and disciplinary actions. This system supports multiple user roles including Administrators, Staff (Teachers, Principals), Students, and Parents, providing a unified portal for modern school management.

[Student Info App](https://student-info-app-next-js.vercel.app)

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js (Auth.js)](https://authjs.dev/) with Database Sessions
- **State Management & Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest) & [Axios](https://axios-http.com/)
- **Styling & UI**: [Tailwind CSS](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Caching & Rate Limiting**: [Redis (Upstash)](https://upstash.com/)
- **Email**: [Nodemailer](https://nodemailer.com/) & [React Email](https://react.email/)
- **Testing**: [Playwright](https://playwright.dev/)

## ✨ Key Features

- **Role-Based Access Control**: Tailored dashboards and permissions for Admin, Teachers, Students, and Parents.
- **Academic Management**: Organize Classrooms, Subjects, and Teaching Assignments seamlessly.
- **Grading System**: Track student progress with Gradebooks, Assessments (Homework, Quizzes, Exams, Projects), and automated score calculations.
- **Discipline & Attendance**: Record daily attendance and manage demerit points efficiently.
- **Parent Portal**: Allows parents to view their child's academic progress, attendance, and discipline records in real-time.
- **Interactive Dashboards**: Comprehensive data visualization using Recharts.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- PostgreSQL database
- Redis instance (e.g., Upstash)
- Google OAuth Credentials (for social login)

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

   _(Note: This project uses `npm`. Run `npm install` to install all packages)._

2. **Environment Setup:**
   Create a `.env` file in the root directory and configure the following variables:

   ```env
   DATABASE_URL="your-postgresql-connection-string"
   AUTH_SECRET="your-auth-secret"
   AUTH_GOOGLE_ID="your-google-oauth-client-id"
   AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
   AUTH_TRUST_HOST="true"
   EMAIL_SERVER="smtp://host:port"
   EMAIL_USER="your-email-user"
   EMAIL_PASSWORD="your-email-password"
   EMAIL_FROM="noreply@yourdomain.com"
   REDIS_URL="your-redis-url"
   RESET_TOKEN_SECRET="your-reset-token-secret"
   ```

3. **Database Setup:**
   Generate Prisma client and push the schema to your database:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate-dev
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## 📂 Project Structure

- `app/`: Next.js App Router pages, layouts, and API routes.
- `components/`: Reusable React components including UI primitives, interactive forms, and dashboards.
- `db/`: Prisma schema (`schema-postgresql.prisma`) and database connection utilities.
- `lib/`: Utility functions, constants (e.g., Query Keys config), and schema definitions.
- `hooks/`: Custom React hooks for shared logic.
- `tests/`: End-to-end and integration tests using Playwright.

## 📜 Available Scripts

- `npm run dev` - Starts the development server.
- `npm run build` - Builds the application for production.
- `npm run start` - Starts the production server.
- `npm run lint` - Runs ESLint.
- `npm run prisma:migrate-dev` - Runs Prisma migrations for the development environment.
- `npm run prisma:studio` - Opens Prisma Studio to view and manage your database.
