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
        const response = await axios.get("/api/student", {
          params: {
            grade: studentInfo.grade,
            major: studentInfo.major,
            classNumber: studentInfo.classNumber,
            subjectName: selectedSubject,
            studentId: studentInfo.id,
            page,
          },
        });

        const studentData = response.data.students;
        let marksData: any[] = [];
        const targetStudent = Array.isArray(studentData)
          ? studentData[0]
          : studentData;

        if (
          targetStudent &&
          targetStudent.subjectMarks &&
          targetStudent.subjectMarks.length > 0
        ) {
          const subjectMark = targetStudent.subjectMarks[0]; // Specific subject
          if (subjectMark && subjectMark.marks) {
            marksData = subjectMark.marks;
          }
        }

        setStudentName(response.data.students.name);
        setMarks(marksData);
      } catch (error) {
        console.error("Failed to fetch marks", error);
        setMarks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, [selectedSubject, page, studentInfo]);

  // Client-side pagination logic since API returns all marks (I Don't think we need this because I've already made pagination on the route site)
  const recordsPerPage = 10;
  const paginatedMarks = marks.slice(
    page * recordsPerPage,
    (page + 1) * recordsPerPage
  );
  const hasMore = (page + 1) * recordsPerPage < marks.length;

  return (
    <div className="space-y-6">
      <h1 className="font-bold text-2xl sm:text-4xl mt-10 lg:mt-0">
        {studentName}'s Marks
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
            totalAssignments={marks.length}
          />

          <MarkTable
            marks={paginatedMarks}
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
