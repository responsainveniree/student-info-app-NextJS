import ExcelDownloadEmail from "@/emails/ExcelDownloadEmail";
import { inngest } from "./client";
import { getStudentExport } from "@/services/student/student-service";
import { put } from "@vercel/blob";
import { getFullClassLabel } from "@/lib/utils/labels";
import path from "path";
import fs from "fs/promises";
import { sendEmail } from "@/emails/nodeMailer";
import { render } from "@react-email/render";

export const generateStudentsExcel = inngest.createFunction(
  {
    id: "generate-students-excel",
    concurrency: { limit: 5 },
    triggers: { event: "app/students.export.requested" },
  },
  async ({ event, step }) => {
    const { payload, userEmail, username } = event.data;

    // 1. Match the key name here
    const { buffer } = await step.run("generate-excel", async () => {
      const result = await getStudentExport(payload);
      return { buffer: result };
    });

    // 2. Use that same key here
    const downloadUrl = await step.run("upload-to-storage", async () => {
      const bufferToUpload = Buffer.from(buffer.studentBuffer);

      const blob = await put(`students-${payload.major}.xlsx`, bufferToUpload, {
        access: "public",
        addRandomSuffix: false, // Keeps the name clean
        allowOverwrite: true, // This fixes your current error
      });
      return blob.url;
    });

    //  local

    // const downloadUrl = await step.run("save-locally", async () => {
    //   const fileName = `students-${getFullClassLabel(
    //     payload.grade,
    //     payload.major,
    //     payload.section,
    //   )}.xlsx`;
    //   // This path points to your Next.js /public folder
    //   const filePath = path.join(process.cwd(), "public", "exports", fileName);

    //   // Create folder if it doesn't exist
    //   await fs.mkdir(path.dirname(filePath), { recursive: true });

    //   // Write the file
    //   await fs.writeFile(filePath, studentBuffer);

    //   // Return the localhost URL
    //   return `http://localhost:3000/exports/${fileName}`;
    // });

    console.log(payload);

    const html = await render(
      ExcelDownloadEmail({
        schoolName: "SMK ADVENT",
        teacherName: username,
        classroom: getFullClassLabel(
          payload.grade,
          payload.major,
          payload.section,
        ),
        currentTime: new Date().toLocaleString("id-ID", {
          dateStyle: "full",
          timeStyle: "short",
        }),
        downloadUrl: downloadUrl,
      }),
    );

    //Work on here
    await step.run("send-email", async () => {
      sendEmail({
        email: userEmail,
        html,
        subject: `${getFullClassLabel(
          payload.grade,
          payload.major,
          payload.section,
        )} Data in Excel Format`,
      });
    });

    return { downloadUrl };
  },
);
