import { auth } from "@/lib/auth/authNode";
import { getRoleDashboard, isAllStaffRole } from "@/lib/constants/roles";
import { redirect } from "next/navigation";
import ProblemPointForm from "@/components/dashboard/ProblemPointForm";

const Page = async () => {
    const session = await auth();

    if (!session) {
        return redirect("/sign-in");
    }

    if (!isAllStaffRole(session.user.role)) {
        return redirect(getRoleDashboard(session.user.role));
    }

    return (
        <div className="container py-8 max-w-4xl mx-auto">
            <h1 className="mt-10 text-3xl font-bold mb-8 text-gray-800">Assign Problem Points</h1>
            <ProblemPointForm session={session} />
        </div>
    );
};

export default Page;
