import {
  ALLOWED_EXTENSIONS,
  AllowedExtensions,
} from "@/lib/constants/allowedExtensions";
import { badRequest } from "@/lib/errors";

export function validateExcelExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (
    !extension ||
    !ALLOWED_EXTENSIONS.includes(extension as AllowedExtensions)
  ) {
    throw badRequest("Please upload an Excel file (.xlsx or .xls)");
  }
}
