"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";

interface ProblemPointChartProps {
    data: {
        name: string;
        value: number;
        color: string;
    }[];
}

export const ProblemPointChart = ({ data }: ProblemPointChartProps) => {
    if (data.every((d) => d.value === 0)) {
        return (
            <div className="flex h-[300px] items-center justify-center text-gray-400 text-sm">
                No problem points recorded.
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={300}
            >
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => [`${value} points`, ""]}
                        contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB" }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
