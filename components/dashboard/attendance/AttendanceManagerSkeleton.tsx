"use client";

import { Skeleton } from "@/components/ui/skeleton";

const AttendanceManagerSkeleton = () => {
  return (
    <div className="space-y-6 pb-8">
      {/* Header Section Skeleton */}
      <div className="m-8 mt-0 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="p-2 w-10 h-10 rounded-lg bg-white/20" />
            <div>
              <Skeleton className="h-8 w-48 bg-white/20 mb-2" />
              <Skeleton className="h-4 w-64 bg-white/20" />
            </div>
          </div>

          {/* Statistics Cards Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20"
              >
                <Skeleton className="h-7 w-full bg-white/20 mb-2" />
                <Skeleton className="h-4 w-full bg-white/20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Card Skeleton */}
      <div className="mx-4 sm:mx-6 lg:mx-8">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] overflow-hidden">
          {/* Card Header Skeleton */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-[#E5E7EB] bg-[#F9FAFB]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Search Input Skeleton */}
                <Skeleton className="h-10 w-full lg:w-[250px] rounded-md" />
              </div>

              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                {/* Sort Select Skeleton */}
                <Skeleton className="h-10 sm:w-[180px] lg:w-[250px] rounded-md" />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  {/* Date Picker Skeleton */}
                  <Skeleton className="h-10 w-full sm:w-40 rounded-lg" />
                  {/* Save Button Skeleton */}
                  <Skeleton className="h-10 w-full sm:w-40 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Table Skeleton */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9FAFB] border-b-2 border-[#E5E7EB]">
                <tr>
                  <th className="px-6 lg:px-8 py-4 text-left">
                    <Skeleton className="h-4 w-28" />
                  </th>
                  <th className="px-6 lg:px-8 py-4 text-left">
                    <Skeleton className="h-4 w-36" />
                  </th>
                  <th className="px-6 lg:px-8 py-4 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {[...Array(8)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 lg:px-8 py-5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-5">
                      <Skeleton className="h-10 w-40 rounded-lg" />
                    </td>
                    <td className="px-6 lg:px-8 py-5">
                      <Skeleton className="h-10 w-full max-w-md rounded-md" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View Skeleton */}
          <div className="sm:hidden divide-y divide-[#E5E7EB]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="pt-2">
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                  <div className="pt-2">
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagerSkeleton;
