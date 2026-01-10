import React, { useState } from "react";
import { Upload, X } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Prop {
  onImport: (data: any[]) => void;
}

export const ExcelImport = ({ onImport }: Prop) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        onImport(jsonData);
        setIsOpen(false);
        setFile(null);
        toast.success(`Imported ${jsonData.length} rows`);
      } catch (error) {
        console.error(error);
        toast.error("Failed to parse Excel file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" /> Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Student Scores</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center space-y-2 bg-gray-50">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-500">
              Upload .xlsx or .csv file.
              <br />
              Expected columns: Student ID, Subject name, Student Assessments
            </p>
            <Input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="max-w-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleImport} disabled={!file}>
            Parse & Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
