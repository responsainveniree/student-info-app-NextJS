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
import MarkStatsCards from "./MarkStatsCards";
import MarkTable from "./MarkTable";
import MarkSkeleton from "./MarkSkeleton";
import { SUBJECT_DISPLAY_MAP } from "@/lib/utils/labels";
import { toast } from "sonner";
import { Session } from "@/lib/types/session";

interface Subject {
  id: number;
  subjectName: string;
}

interface StudentMarkViewProps {
  session: Session;
}

const StudentMarkView = ({ session }: StudentMarkViewProps) => {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get("/api/student/profile", {
          params: {
            studentId: session.id,
          },
        });

        if (response.status === 200) {
          const subjectsData = response.data?.data?.subjects.studentSubjects;

          console.log(subjectsData);
          if (Array.isArray(subjectsData)) {
            setSubjects(subjectsData);
          }
        }
      } catch (error) {
        setSubjects([]);
        toast.error("Something went wrong. Can't retrieve subjects data");
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;

    const fetchMarks = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/student/profile", {
          params: {
            studentId: session.id,
            subjectName: selectedSubject,
            isMarkPage: true,
            page,
          },
        });

        if (response.status === 200) {
          const data = response.data.data.marks;

          let marksData: any[] = [];
          if (data.studentMarkRecords?.subjectMarks?.[0]?.marks) {
            marksData = data.studentMarkRecords.subjectMarks[0].marks;
          }

          setMarks(marksData);
          setTotalRecords(data.totalMarks || 0);
        }
      } catch (error) {
        console.error("Failed to fetch marks", error);
        toast.error("Failed to fetch marks data");
        setMarks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarks();
  }, [selectedSubject, page, session.id]);

  const recordsPerPage = 10;
  const hasMore = (page + 1) * recordsPerPage < totalRecords;

  return (
    <div className="space-y-6">
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
        <div>
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
        </div>
      )}
    </div>
  );
};

export default StudentMarkView;
