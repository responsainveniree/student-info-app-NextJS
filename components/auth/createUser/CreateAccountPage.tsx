"use client";

import { useState } from "react";
import { GraduationCap, Users, BookOpen } from "lucide-react";
import TeacherFormModal from "./TeacherFormModal";
import StudentFormModal from "./StudentFormModal";

const CreateAccountPage = () => {
    const [teacherModalOpen, setTeacherModalOpen] = useState(false);
    const [studentModalOpen, setStudentModalOpen] = useState(false);

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">

            {/* Content */}
            <div className="relative z-10 w-full max-w-3xl">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 text-white text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                            <GraduationCap className="w-12 h-12" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                        <p className="text-blue-100">Select the type of account you want to create</p>
                    </div>

                    {/* Role Selector Buttons */}
                    <div className="p-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Teacher Account Button */}
                            <button
                                onClick={() => setTeacherModalOpen(true)}
                                className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 hover:border-blue-400 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                data-testid="create-teacher-btn"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                                        <BookOpen className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-2">Create Teacher Account</h2>
                                    <p className="text-gray-600 text-sm">
                                        Register teachers with homeroom assignments, teaching classes, and subject assignments
                                    </p>
                                </div>
                            </button>

                            {/* Student Account Button */}
                            <button
                                onClick={() => setStudentModalOpen(true)}
                                className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                data-testid="create-student-btn"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                                        <Users className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-2">Create Student Account</h2>
                                    <p className="text-gray-600 text-sm">
                                        Register students with grade, major, class number, and role information
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Info Text */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-500 text-sm">
                                Both options support bulk import via Excel file upload
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TeacherFormModal open={teacherModalOpen} onOpenChange={setTeacherModalOpen} />
            <StudentFormModal open={studentModalOpen} onOpenChange={setStudentModalOpen} />
        </div>
    );
};

export default CreateAccountPage;
