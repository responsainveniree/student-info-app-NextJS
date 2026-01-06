import { auth } from "@/lib/auth/authNode";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/sign-in");
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role={session.user.role} isHomeroomClassTeacher={session.user.isHomeroomClassTeacher} />
            <main className="flex-1 lg:ml-64 overflow-y-auto w-full">
                {children}
            </main>
        </div>
    );
}
