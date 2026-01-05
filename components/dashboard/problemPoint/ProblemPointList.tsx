"use client";

import { BadgeAlert, Clock, AlertTriangle } from "lucide-react";

interface ProblemPointRecord {
    category: string;
    description: string;
    point: number;
    date: string | Date;
}

interface ProblemPointListProps {
    data: ProblemPointRecord[];
}

const CATEGORY_COLORS: Record<string, string> = {
    LATE: "bg-orange-100 text-orange-700",
    INCOMPLETE_ATTRIBUTES: "bg-gray-100 text-gray-700",
    DISCIPLINE: "bg-red-100 text-red-700",
    ACADEMIC: "bg-blue-100 text-blue-700",
    SOCIAL: "bg-green-100 text-green-700",
    OTHER: "bg-purple-100 text-purple-700",
};

export const ProblemPointList = ({ data }: ProblemPointListProps) => {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <AlertTriangle className="w-12 h-12 mb-2 opacity-20" />
                <p>No problem points recorded</p>
            </div>
        );
    }

    // Sort by date desc
    const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {sortedData.map((item, index) => {
                const dateObj = new Date(item.date);
                const wibDate = new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Jakarta"
                }).format(dateObj);

                return (
                    <div
                        key={index}
                        className="flex items-start p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow gap-4"
                    >
                        <div className={`p-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[item.category] || "bg-gray-100"}`}>
                            <BadgeAlert className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold text-gray-800 truncate pr-2">{item.category.replace(/_/g, " ")}</h4>
                                <span className="text-red-600 font-bold whitespace-nowrap">+{item.point} pts</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                            <div className="flex items-center mt-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {wibDate}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
