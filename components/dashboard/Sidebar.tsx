"use client";

import { SignOut } from "@/components/auth/SignOut";
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  ClipboardCheck,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Home,
  School,
  BookX,
  ChartNoAxesCombined,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ROLES } from "@/lib/constants/roles";

interface SidebarProps {
  role?: string;
  isHomeroomClassTeacher?: boolean;
}

export const Sidebar = ({ role, isHomeroomClassTeacher }: SidebarProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const isActive = (path: string) => pathname === path;

  // Define navigation items for each role
  const getNavItems = (currentRole?: string) => {
    const commonItems = [
      // { href: "#", icon: User, label: "Profile", always: true },
      // { href: "#", icon: Settings, label: "Settings", always: true },
      { href: "/", icon: Home, label: "School Profile" },
    ];

    switch (currentRole) {
      case ROLES.TEACHER:
        const teacherItems = [
          {
            href: "/dashboard/teacher",
            icon: LayoutDashboard,
            label: "Dashboard",
          },

          {
            href: "/dashboard/teacher/mark",
            icon: ChartNoAxesCombined,
            label: "Student Assignment",
          },
          {
            href: "/dashboard/problem-point",
            icon: BookX,
            label: "Problem Point",
          },
        ];

        if (isHomeroomClassTeacher) {
          teacherItems.splice(1, 0, {
            href: "/dashboard/teacher/classroom",
            icon: School,
            label: "Classroom",
          });
        }

        return [...teacherItems, ...commonItems];
      case ROLES.VICE_PRINCIPAL:
      case ROLES.PRINCIPAL:
        return [
          {
            href: "/dashboard/staff",
            icon: LayoutDashboard,
            label: "Dashboard",
          },
          { href: "/create-account", icon: Users, label: "Create Account" },
          {
            href: "/dashboard/staff/export",
            icon: FileSpreadsheet,
            label: "Export Students",
          },
          {
            href: "/dashboard/problem-point",
            icon: BookX,
            label: "Problem Point",
          },
          ...commonItems,
        ];
      case ROLES.PARENT:
        return [
          {
            href: "/dashboard/parent",
            icon: LayoutDashboard,
            label: "Dashboard",
          },
          { href: "/dashboard/parent/mark", icon: TrendingUp, label: "Marks" },
          ...commonItems,
        ];
      case ROLES.STUDENT:
        return [
          {
            href: "/dashboard/student",
            icon: BookOpen,
            label: "Dashboard",
          },
          { href: "/dashboard/student/mark", icon: TrendingUp, label: "Marks" },
          ...commonItems,
        ];
      case ROLES.CLASS_SECRETARY:
        return [
          {
            href: "/dashboard/student",
            icon: BookOpen,
            label: "Dashboard",
          },
          {
            href: "/dashboard/attendance",
            icon: ClipboardCheck,
            label: "Attendance",
          },
          { href: "/dashboard/student/mark", icon: TrendingUp, label: "Marks" },
          ...commonItems,
        ];

      default:
        return commonItems;
    }
  };

  const navItems = getNavItems(role);

  const getPortalTitle = (currentRole?: string) => {
    switch (currentRole) {
      case ROLES.TEACHER:
        return "Teacher Portal";
      case ROLES.VICE_PRINCIPAL:
      case ROLES.PRINCIPAL:
        return "Staff Portal";
      case ROLES.PARENT:
        return "Parent Portal";
      default:
        return "Student Portal";
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#111827]">SMK Advent</h1>
            <p className="text-xs text-gray-500">{getPortalTitle(role)}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white"
                  : "text-[#111827] hover:bg-[#F9FAFB]"
              }`}
            >
              {item.icon && <item.icon className="w-5 h-5" />}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Sign Out Button */}
      <div className="absolute bottom-6 left-6 right-6">
        <SignOut />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md border border-[#E5E7EB] hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-[#111827]" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white border-r border-[#E5E7EB] shadow-sm z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-[#E5E7EB] shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-[#111827]" />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
};
