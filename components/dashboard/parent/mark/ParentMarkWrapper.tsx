"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import ParentMarkView from "./ParentMarkView";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Session } from "@/lib/types/session";

interface ParentMarkWrapperProps {
    session: Session;
}

const ParentMarkWrapper = ({ session }: ParentMarkWrapperProps) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        subjects: any[];
        student: any;
    } | null>(null);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const res = await axios.get("/api/parent", {
                    params: {
                        parentId: session.id, // Using the correct ID from session
                    },
                });

                if (res.status === 200) {
                    const { student, studentSubjects } = res.data.data;
                    setData({
                        student,
                        subjects: studentSubjects
                    });
                }
            } catch (error) {
                console.error("Error fetching parent student data:", error);
                toast.error("Failed to load student data.");
            } finally {
                setLoading(false);
            }
        };

        if (session?.id) {
            fetchStudentData();
        }
    }, [session?.id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    if (!data || !data.student) {
        return <div>No student data found for this parent account.</div>;
    }

    return (
        <ParentMarkView
            subjects={data.subjects}
            studentInfo={data.student}
        />
    );
};

export default ParentMarkWrapper;
