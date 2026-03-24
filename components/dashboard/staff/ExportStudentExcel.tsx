"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Spinner } from "../../ui/spinner";
import { CLASS_SECTION, GRADES, MAJORS } from "../../../lib/constants/class";
import {
  GRADE_DISPLAY_MAP,
  MAJOR_DISPLAY_MAP,
} from "../../../lib/utils/labels";
import { FileSpreadsheet, Download } from "lucide-react";
import { getErrorMessage } from "@/lib/utils/getErrorMessage";

const ExportStudentExcel = () => {
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState({
    grade: "",
    major: "",
    section: "",
  });

  const isClassSelected =
    selectedClass.grade && selectedClass.major && selectedClass.section;

  const handleDownload = async () => {
    if (!isClassSelected) {
      toast.error("Please select a class first");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get("/api/staff/export-students", {
        params: {
          grade: selectedClass.grade,
          major: selectedClass.major,
          section: selectedClass.section,
        },
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with class info
      const fileName = `Students-${selectedClass.grade}-${selectedClass.major}-${selectedClass.section}.xlsx`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel file downloaded successfully");
    } catch (error: any) {
      console.error("Download error:", error);
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedClass({
      grade: "",
      major: "",
      section: "",
    });
  };

  return (
    <div className="max-w-2xl mx-auto mt-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Export Student Data
            </h1>
            <p className="text-gray-500">
              Download student information as Excel file
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Select Class
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Grade Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Grade</label>
              <Select
                value={selectedClass.grade}
                onValueChange={(val) =>
                  setSelectedClass({ ...selectedClass, grade: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {GRADE_DISPLAY_MAP[g]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Major Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Major</label>
              <Select
                value={selectedClass.major}
                onValueChange={(val) =>
                  setSelectedClass({ ...selectedClass, major: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Major" />
                </SelectTrigger>
                <SelectContent>
                  {MAJORS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MAJOR_DISPLAY_MAP[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Number Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Class Number
              </label>
              <Select
                value={selectedClass.section}
                onValueChange={(val) =>
                  setSelectedClass({ ...selectedClass, section: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_SECTION.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === "none" ? "None" : `Class ${c}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Selected Class Preview */}
        {isClassSelected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Selected:</span>{" "}
              {GRADE_DISPLAY_MAP[selectedClass.grade]} -{" "}
              {MAJOR_DISPLAY_MAP[selectedClass.major]}
              {selectedClass.section !== "none" &&
                ` - Class ${selectedClass.section}`}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!isClassSelected || loading}
            className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E3A8A]/90 hover:to-[#3B82F6]/90"
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Excel
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
        <p className="font-medium text-gray-700 mb-1">Note:</p>
        <p>
          The exported Excel file will contain student ID and name columns for
          the selected class. This can be used to import student assignments
          more easily.
        </p>
      </div>
    </div>
  );
};

export default ExportStudentExcel;
