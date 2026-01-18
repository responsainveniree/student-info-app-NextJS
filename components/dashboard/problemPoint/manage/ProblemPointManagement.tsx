"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { GRADES, MAJORS, CLASSNUMBERS } from "@/lib/constants/class";
import { GRADE_DISPLAY_MAP, MAJOR_DISPLAY_MAP } from "@/lib/utils/labels";
import { BadgeAlert, Clock, AlertTriangle, Trash2, Pencil } from "lucide-react";
import ProblemPointForm from "../create/ProblemPointForm";
import { Session } from "@/lib/types/session";

const CATEGORY_COLORS: Record<string, string> = {
  LATE: "bg-orange-100 text-orange-700",
  INCOMPLETE_ATTRIBUTES: "bg-gray-100 text-gray-700",
  DISCIPLINE: "bg-red-100 text-red-700",
  ACADEMIC: "bg-blue-100 text-blue-700",
  SOCIAL: "bg-green-100 text-green-700",
  OTHER: "bg-purple-100 text-purple-700",
};

interface ProblemPointManagementProps {
  session: Session;
}

export default function ProblemPointManagement({
  session,
}: ProblemPointManagementProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    grade: "",
    major: "",
    classNumber: "",
  });

  // Edit Mode
  const [editItem, setEditItem] = useState<any | null>(null);

  // Delete Confirmation
  const [deleteItem, setDeleteItem] = useState<any | null>(null);

  const isClassSelected = filters.grade && filters.major && filters.classNumber;

  const fetchData = async () => {
    if (!isClassSelected) return;

    setLoading(true);
    try {
      const res = await axios.get("/api/problem-point", {
        params: {
          grade: filters.grade,
          major: filters.major,
          classNumber: filters.classNumber,
          recordedBy: session.id,
        },
      });
      setData(res.data.data || []);
      console.log(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch problem points");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, isClassSelected]);

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      await axios.delete("/api/problem-point", {
        params: { problemPointId: deleteItem.id, teacherId: session.id },
      });
      toast.success("Record deleted successfully");
      setDeleteItem(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete record");
    }
  };

  if (editItem) {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Edit Problem Point</h3>
          <Button variant="ghost" onClick={() => setEditItem(null)}>
            Back to List
          </Button>
        </div>
        <ProblemPointForm
          session={session}
          mode="edit"
          initialData={editItem}
          onSuccess={() => {
            setEditItem(null);
            fetchData();
          }}
          onCancel={() => setEditItem(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <h3 className="text-sm font-medium mb-3 text-gray-500 uppercase tracking-wider">
          Filter by Class
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={filters.grade}
            onValueChange={(val) => setFilters({ ...filters, grade: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map((g) => (
                <SelectItem key={g} value={g}>
                  {GRADE_DISPLAY_MAP[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.major}
            onValueChange={(val) => setFilters({ ...filters, major: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Major" />
            </SelectTrigger>
            <SelectContent>
              {MAJORS.map((m) => (
                <SelectItem key={m} value={m}>
                  {MAJOR_DISPLAY_MAP[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.classNumber}
            onValueChange={(val) =>
              setFilters({ ...filters, classNumber: val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Class Number" />
            </SelectTrigger>
            <SelectContent>
              {CLASSNUMBERS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "none" ? "None" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white min-h-[400px] rounded-xl border shadow-sm p-6">
        {!isClassSelected ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>Select a class to view problem points</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <AlertTriangle className="w-12 h-12 mb-2 opacity-20" />
            <p>No problem points found for this class</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
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
                    {item.student.name.split(" ").length > 0
                      ? `${item.student.name.split(" ")[0]} ${item.student.name.split(" ")[1]?.[0] ?? ""}`
                      : item.student.name}
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
                    {item.point} pts
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
              problem point record for{" "}
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
