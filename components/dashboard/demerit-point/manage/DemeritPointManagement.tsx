"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button";
import { Spinner } from "../../../../components/ui/spinner";
import { ITEMS_PER_PAGE } from "../../../../lib/constants/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import {
  BadgeAlert,
  Clock,
  AlertTriangle,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DemeritPointForm from "../create/DemeritPointForm";
import { DEMERIT_POINT_KEYS } from "../../../../lib/constants/tanStackQueryKeys";
import { abbreviateName } from "../../../../lib/utils/nameFormatter";

const CATEGORY_COLORS: Record<string, string> = {
  LATE: "bg-orange-100 text-orange-700",
  UNIFORM: "bg-gray-100 text-gray-700",
  DISCIPLINE: "bg-red-100 text-red-700",
  ACADEMIC: "bg-blue-100 text-blue-700",
  SOCIAL: "bg-green-100 text-green-700",
  OTHER: "bg-purple-100 text-purple-700",
};

export default function DemeritPointManagement() {
  const queryClient = useQueryClient();

  // Pagination
  const [page, setPage] = useState(0);

  // Edit Mode
  const [editItem, setEditItem] = useState<any | null>(null);

  // Delete Confirmation
  const [deleteItem, setDeleteItem] = useState<any | null>(null);

  // Fetch demerit points with useQuery
  const { data: responseData, isLoading: loading } = useQuery({
    queryKey: DEMERIT_POINT_KEYS.list({
      page,
    }),
    queryFn: async () => {
      const res = await axios.get("/api/demerit-point", {
        params: { page },
      });
      return res.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const data = responseData?.data || [];
  const totalRecords = responseData?.totalRecords || 0;
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete("/api/demerit-point", {
        params: { demeritRecordId: id },
      });
    },
    onSuccess: () => {
      toast.success("Record deleted successfully");
      setDeleteItem(null);
      queryClient.invalidateQueries({
        queryKey: DEMERIT_POINT_KEYS.lists(),
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to delete record");
    },
  });

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id);
  };

  if (editItem) {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Edit Demerit Point</h3>
          <Button variant="ghost" onClick={() => setEditItem(null)}>
            Back to List
          </Button>
        </div>
        <DemeritPointForm
          mode="edit"
          initialData={editItem}
          onSuccess={() => {
            setEditItem(null);
          }}
          onCancel={() => setEditItem(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* List */}
      <div className="bg-white min-h-[400px] rounded-xl border shadow-sm p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <AlertTriangle className="w-12 h-12 mb-2 opacity-20" />
            <p>No demerit points found for this class</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item: any) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row gap-4 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
              >
                {/* Icon */}
                <div
                  className={`p-2 rounded-full h-fit ${CATEGORY_COLORS[item.category] || "bg-gray-100"}`}
                >
                  <BadgeAlert className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h4 className="font-semibold text-gray-800">
                    {abbreviateName(item.student.user.name)}
                  </h4>

                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="font-medium">
                      {item.category.replace(/_/g, " ")}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600 truncate max-w-[300px]">
                      {item.description}
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex flex-col justify-between items-end">
                  <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-sm">
                    {item.points} pts
                  </span>

                  <div className="flex gap-2 mt-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setEditItem(item)}
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
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-600">
              Showing {page * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min((page + 1) * ITEMS_PER_PAGE, totalRecords)} of{" "}
              {totalRecords} records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0 || loading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm font-medium text-gray-700 px-3">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={page >= totalPages - 1 || loading}
                className="flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

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
              demerit point record for{" "}
              <span className="font-bold">{deleteItem?.student?.name}</span>.
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
}
