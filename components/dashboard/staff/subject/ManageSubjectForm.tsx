"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { SUBJECT_KEYS } from "@/lib/constants/tanStackQueryKeys";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { Spinner } from "../../../ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../ui/alert-dialog";
import { GRADE_DISPLAY_MAP, MAJOR_DISPLAY_MAP } from "@/lib/utils/labels";
import {
  Search,
  ArrowUpDown,
  BookOpen,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import SubjectForm from "./SubjectForm";
import { getErrorMessage } from "@/lib/utils/getErrorMessage";
import { PatchSubjectSchema, SubjectQueriesSchema } from "@/lib/zod/subject";
import { subjectApi } from "@/features/subject/services/subject-api";
import { GetSubjectResponse } from "@/features/subject/types/subject-types";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

const ITEMS_PER_PAGE = 10;

const SUBJECT_TYPE_COLORS: Record<string, string> = {
  GENERAL: "bg-blue-100 text-blue-700",
  MAJOR: "bg-purple-100 text-purple-700",
};

const ManageSubjectForm = () => {
  // State management
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteItem, setDeleteItem] = useState<any | null>(null);

  // Filtering
  const [sortBy, setSortBy] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const effectiveSearchQuery =
    debouncedSearchQuery.length >= 3 ? debouncedSearchQuery : "";
  const [currentPage, setCurrentPage] = useState(0);

  const [filters, setFilters] = useState<SubjectQueriesSchema>({
    page: 0,
    sortOrder: "asc",
    subjectName: "",
    getAll: false,
  });
  useEffect(() => {
    setCurrentPage(0);
  }, [effectiveSearchQuery, sortBy]);

  // Sync filters with UI state
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: currentPage,
      sortOrder: sortBy,
      subjectName: effectiveSearchQuery || undefined,
    }));
  }, [currentPage, sortBy, effectiveSearchQuery]);

  // Edit mode
  const [editItem, setEditItem] = useState<PatchSubjectSchema | null>(null);

  // Query
  const subjects = useQuery<GetSubjectResponse>({
    queryKey: SUBJECT_KEYS.list(filters),
    queryFn: subjectApi.getAll,
  });

  const queryClient = useQueryClient();

  const totalPages = Math.ceil(
    (subjects.data?.totalSubject || 0) / ITEMS_PER_PAGE,
  );

  const handleDelete = async () => {
    setErrorMessage("");
    if (!deleteItem) return;

    const deletePromise = axios.delete("/api/staff/subject", {
      params: {
        subjectId: deleteItem.id,
      },
    });

    toast.promise(deletePromise, {
      loading: "Deleting subject...",
      success: () => {
        queryClient.invalidateQueries({ queryKey: SUBJECT_KEYS.all });
        setDeleteItem(null);
        return `Successfully deleted ${deleteItem.subjectName}`;
      },
      error: async (err) => {
        const msg = await getErrorMessage(err);
        setErrorMessage(msg);
        toast.error("Something went wrong. Read the message above");
        return msg;
      },
    });
  };

  // Edit mode view
  if (editItem) {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Edit Subject</h3>
          <Button variant="ghost" onClick={() => setEditItem(null)}>
            Back to List
          </Button>
        </div>
        <SubjectForm
          mode="edit"
          initialData={editItem}
          onSuccess={() => {
            setEditItem(null);
            queryClient.invalidateQueries({ queryKey: SUBJECT_KEYS.all });
          }}
          onCancel={() => setEditItem(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Search & Sort */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <h3 className="text-sm font-medium mb-3 text-gray-500 uppercase tracking-wider">
          Search & Filter
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by subject name (min. 3 chars)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              setSortBy((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortBy === "asc" ? "A → Z" : "Z → A"}
          </Button>
        </div>
      </div>

      {/* Subject List */}
      <div className="bg-white min-h-[400px] rounded-xl border shadow-sm p-6">
        {subjects.isLoading ? (
          <div className="flex justify-center items-center h-full min-h-[300px]">
            <Spinner />
          </div>
        ) : subjects.data?.subjects?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
            <AlertTriangle className="w-12 h-12 mb-2 opacity-20" />
            <p>No subjects found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.data?.subjects?.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row gap-4 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
              >
                {/* Icon */}
                <div className="p-2 rounded-full h-fit bg-emerald-100 text-emerald-700">
                  <BookOpen className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <h4 className="font-semibold text-gray-800">{item.name}</h4>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Subject Type Badge */}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUBJECT_TYPE_COLORS[item.config?.type] || "bg-gray-100 text-gray-700"}`}
                    >
                      {item.config?.type}
                    </span>

                    {/* Grade Badges */}
                    {item.config?.allowedGrades?.map((g: string) => (
                      <span
                        key={g}
                        className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium"
                      >
                        {GRADE_DISPLAY_MAP[g] || g}
                      </span>
                    ))}

                    {/* Major Badges */}
                    {item.config?.allowedMajors?.map((m: string) => (
                      <span
                        key={m}
                        className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium"
                      >
                        {MAJOR_DISPLAY_MAP[m] || m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      setEditItem({
                        subjectId: item.id,
                        subjectName: item.name,
                        subjectConfig: item.config,
                      })
                    }
                  >
                    <Pencil className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 hover:bg-red-50 hover:border-red-200"
                    onClick={() => setDeleteItem(item)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0 || subjects.isLoading}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm font-medium text-gray-700">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
            }
            disabled={currentPage >= totalPages - 1 || subjects.isLoading}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Delete Alert */}
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              subject{" "}
              <span className="font-bold">{deleteItem?.subjectName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageSubjectForm;
