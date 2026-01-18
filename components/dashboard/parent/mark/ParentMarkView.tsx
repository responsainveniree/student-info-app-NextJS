"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MarkStatsCards from "../../student/mark/MarkStatsCards";
import MarkTable from "../../student/mark/MarkTable";
import MarkSkeleton from "../../student/mark/MarkSkeleton";
import { SUBJECT_DISPLAY_MAP } from "@/lib/utils/labels";
import { toast } from "sonner";

interface Subject {
  id: number;
  subjectName: string;
}

interface StudentInfo {
  id: string;
  grade: string;
  major: string;
  classNumber: string;
}

interface ParentMarkViewProps {
  subjects: Subject[];
  studentInfo: StudentInfo;
}

const ParentMarkView = ({ subjects, studentInfo }: ParentMarkViewProps) => {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [studentName, setStudentName] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].subjectName);
    }
  }, [subjects, selectedSubject]);

  useEffect(() => {
    if (!selectedSubject) return;

    const fetchMarks = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/student/profile", {
          params: {
            studentId: studentInfo.id,
            subjectName: selectedSubject,
            isMarkPage: true,
            page,
          },
        });

        const data = response.data.data.marks;

        let marksData: any[] = [];
        if (data.studentMarkRecords?.subjectMarks?.[0]?.marks) {
          marksData = data.studentMarkRecords.subjectMarks[0].marks;
        }

        setStudentName(data.studentMarkRecords?.name || "");
        setMarks(marksData);
        setTotalRecords(data.totalMarks || 0);
      } catch (error) {
        console.error("Failed to fetch marks", error);
        toast.error("Failed to fetch student marks");
        setMarks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, [selectedSubject, page, studentInfo.id]);

  const recordsPerPage = 10;
  const hasMore = (page + 1) * recordsPerPage < totalRecords;

  return (
    <div className="space-y-6">
      <h1 className="font-bold text-2xl sm:text-4xl mt-10 lg:mt-0">
        {studentName.split(" ")[0]}'s Marks
      </h1>
      {/* Subject Dropdown */}
      <div className="w-[250px]">
        <Select
          value={selectedSubject}
          onValueChange={(val) => {
            setSelectedSubject(val);
            setPage(0); // Reset page on subject change
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((sub) => (
              <SelectItem key={sub.id} value={sub.subjectName}>
                {SUBJECT_DISPLAY_MAP[sub.subjectName]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && marks.length === 0 ? (
        <MarkSkeleton />
      ) : (
        <>
          <MarkStatsCards
            subjectName={SUBJECT_DISPLAY_MAP[selectedSubject]}
            totalAssignments={totalRecords}
          />

          <MarkTable
            marks={marks}
            page={page}
            hasMore={hasMore}
            onPageChange={setPage}
            isLoading={loading}
          />
        </>
      )}
    </div>
  );
};

export default ParentMarkView;
