import ParentDashboard from "@/components/dashboard/parent/ParentDashboard";
import React from "react";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";
import { getRoleDashboard, isParentRole } from "@/lib/constants/roles";

const page = async () => {
    const session = await auth();

    if (!session) redirect("/sign-in");

    if (!isParentRole(session.user.role)) {
        redirect(getRoleDashboard(session.user.role));
    }

    return (
        <div>
            <ParentDashboard session={session.user} />
        </div>
    );
};

export default page;