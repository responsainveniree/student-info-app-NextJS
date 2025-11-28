import { SignOut } from "@/components/auth/SignOut";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  User,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";

const StudentDashboard = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  // Mock data - nanti diganti dengan data dari database
  const studentData = {
    name: session.user.name || "Student",
    email: session.user.email || "",
    role: session.user.role || "student",
    grade: "11th Grade",
    major: "Software Engineering",
    class: "Class 1",
    attendance: "95%",
    avgScore: "85.5",
    subjects: [
      { name: "Mathematics", score: 88, color: "#1E3A8A" },
      { name: "English", score: 85, color: "#3B82F6" },
      { name: "Programming", score: 92, color: "#FBBF24" },
      { name: "Database", score: 87, color: "#1E3A8A" },
    ],
    recentActivities: [
      {
        title: "Mathematics Quiz",
        date: "Today, 10:00 AM",
        status: "completed",
      },
      {
        title: "English Assignment",
        date: "Tomorrow, 11:30 AM",
        status: "pending",
      },
      { title: "Programming Project", date: "Dec 5, 2024", status: "upcoming" },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-[#E5E7EB] shadow-sm z-50">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#111827]">SMK Advent</h1>
              <p className="text-xs text-gray-500">Student Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <a
              href="#"
              className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white rounded-xl font-medium transition-all"
            >
              <BookOpen className="w-5 h-5" />
              <span>Dashboard</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-4 py-3 text-[#111827] hover:bg-[#F9FAFB] rounded-xl font-medium transition-all"
            >
              <Calendar className="w-5 h-5" />
              <span>Schedule</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-4 py-3 text-[#111827] hover:bg-[#F9FAFB] rounded-xl font-medium transition-all"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Grades</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-4 py-3 text-[#111827] hover:bg-[#F9FAFB] rounded-xl font-medium transition-all"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-3 px-4 py-3 text-[#111827] hover:bg-[#F9FAFB] rounded-xl font-medium transition-all"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </a>
          </nav>
        </div>

        {/* Sign Out Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <SignOut />
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#111827]">
              Welcome back, {studentData.name}!
            </h2>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your studies today
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-3 hover:bg-white rounded-xl transition-all border border-[#E5E7EB]">
              <Bell className="w-5 h-5 text-[#111827]" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#FBBF24] rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3 bg-white px-4 py-3 rounded-xl border border-[#E5E7EB]">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold">
                {studentData.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">
                  {studentData.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {studentData.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#1E3A8A]/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#1E3A8A]" />
              </div>
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-2xl font-bold text-[#111827] mb-1">
              {studentData.subjects.length}
            </h3>
            <p className="text-sm text-gray-600">Total Subjects</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#FBBF24]/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#FBBF24]" />
              </div>
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-2xl font-bold text-[#111827] mb-1">
              {studentData.avgScore}
            </h3>
            <p className="text-sm text-gray-600">Average Score</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-2xl font-bold text-[#111827] mb-1">
              {studentData.attendance}
            </h3>
            <p className="text-sm text-gray-600">Attendance Rate</p>
          </div>

          <div className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-6 rounded-2xl text-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl">🎓</span>
            </div>
            <h3 className="text-2xl font-bold mb-1">{studentData.grade}</h3>
            <p className="text-sm text-blue-100">{studentData.major}</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subject Performance */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h3 className="text-xl font-bold text-[#111827] mb-6">
              Subject Performance
            </h3>
            <div className="space-y-4">
              {studentData.subjects.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#111827]">
                      {subject.name}
                    </span>
                    <span className="text-sm font-bold text-[#1E3A8A]">
                      {subject.score}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#F9FAFB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-full transition-all duration-500"
                      style={{ width: `${subject.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
            <h3 className="text-xl font-bold text-[#111827] mb-6">
              Recent Activities
            </h3>
            <div className="space-y-4">
              {studentData.recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 hover:bg-[#F9FAFB] rounded-xl transition-all"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === "completed"
                        ? "bg-green-500"
                        : activity.status === "pending"
                        ? "bg-[#FBBF24]"
                        : "bg-[#3B82F6]"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <p className="font-medium text-[#111827] text-sm">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
