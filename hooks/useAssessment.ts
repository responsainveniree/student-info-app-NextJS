import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { ASSESSMENT_KEYS } from "@/lib/constants/tanStackQueryKeys";
import { UpdateStudentAssessmentSchema } from "@/lib/zod/assessment";

const API_BASE = "/api/teacher/student-assessment";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AssessmentFilters {
  grade: string;
  major: string;
  section: string;
  subjectId: number;
}

interface CreateAssessmentPayload {
  class: { grade: string; major: string; section: string };
  subjectId: number;
  subjectName: string;
  assessmentType: string;
  description: { givenAt: string; dueAt: string; title: string };
}

interface StudentAssessmentScore {
  assessmentScoreId: number;
  score: number;
}

interface StudentGradingEntry {
  studentId: string;
  studentAssessments: StudentAssessmentScore[];
}

interface UpdateScoresPayload {
  subjectId: number;
  classId: number;
  students: StudentGradingEntry[];
}

interface DeleteAssessmentParams {
  assessmentId: number;
  teachingAssignmentId: number;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Fetches assessment data for a specific class/subject combination.
 */
export function useAssessments(
  filters: AssessmentFilters,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.list(filters),
    queryFn: async () => {
      const res = await axios.get(API_BASE, {
        params: {
          grade: filters.grade,
          major: filters.major,
          section: filters.section,
          subjectId: String(filters.subjectId),
        },
      });
      return res.data;
    },
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Creates a new assessment assignment column.
 * Invalidates assessment list queries on success.
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAssessmentPayload) => {
      const res = await axios.post(API_BASE, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Assessment column created!");
      queryClient.invalidateQueries({
        queryKey: ASSESSMENT_KEYS.lists(),
      });
    },
    onError: (error) => {
      // console.error("Failed to create assessment:", error);
      toast.error("Failed to create assessment column");
    },
  });
}

/**
 * Batch-updates student assessment scores (dirty fields only).
 * Invalidates assessment list queries on success.
 */
export function useUpdateAssessmentScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateScoresPayload) => {
      const res = await axios.patch(`${API_BASE}/grading`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Scores updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ASSESSMENT_KEYS.lists(),
      });
    },
    onError: (error) => {
      // console.error("Failed to update scores:", error);
      toast.error("Failed to save marks");
    },
  });
}

/**
 * Deletes an assessment and decrements the assignment counter.
 * Invalidates assessment list queries on success.
 */
export function useDeleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeleteAssessmentParams) => {
      const res = await axios.delete(API_BASE, {
        params: {
          assessmentId: params.assessmentId,
          teachingAssignmentId: params.teachingAssignmentId,
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Assessment deleted!");
      queryClient.invalidateQueries({
        queryKey: ASSESSMENT_KEYS.lists(),
      });
    },
    onError: (error) => {
      // console.error("Failed to delete assessment:", error);
      toast.error("Failed to delete assessment");
    },
  });
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateStudentAssessmentSchema) => {
      const res = await axios.patch(API_BASE, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Assessment updated!");
      queryClient.invalidateQueries({
        queryKey: ASSESSMENT_KEYS.lists(),
      });
      window.location.reload();
    },
    onError: (error) => {
      // console.error("Failed to update assessment:", error);
      toast.error("Failed to update assessment");
    },
  });
}
