"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import axios from "axios";
import { Upload, UserPlus, FileSpreadsheet, GraduationCap } from "lucide-react";

const grades = ["tenth", "eleventh", "twelfth"];
const majors = ["softwareEngineering", "accounting"];
const classNumbers = [1, 2];
//Ubah jadi fetch API
const teachers = ["WhoIsHer", "Danny"];

const CreateStudentAccount = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string>("");
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    grade: "",
    major: "",
    classNumber: "",
    teacherName: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("/api/auth/create-student-account", data);
      router.push("/sign-in");
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  const gradeLabels: Record<string, string> = {
    tenth: "Grade 10",
    eleventh: "Grade 11",
    twelfth: "Grade 12",
  };

  const majorLabels: Record<string, string> = {
    softwareEngineering: "Software Engineering",
    accounting: "Accounting",
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="w-12 h-12 mr-3" />
            <h1 className="text-3xl font-bold">Student Registration</h1>
          </div>
        </div>

        <div className="p-8">
          {/* Excel Upload Section */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white mb-4 shadow-lg">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Quick Import
              </h2>
              <p className="text-gray-600">
                Upload Excel file for bulk student registration
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-gray-50 to-white hover:border-green-400 transition-all duration-300">
                <label
                  htmlFor="excel-file"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-green-600" />
                  </div>

                  <span className="text-lg font-semibold text-gray-800 mb-2">
                    {uploadedFile || "Click to upload Excel file"}
                  </span>
                  <span className="text-sm text-gray-500">
                    Supported formats: .xlsx, .xls (Max 5MB)
                  </span>
                </label>

                <input
                  id="excel-file"
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedFile(file.name);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-6 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Or Register Manually
              </span>
            </div>
          </div>

          {/* Manual Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white mb-4 shadow-lg">
                <UserPlus className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Personal Information
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Username <span className="ml-2 text-red-500">*</span>
                </label>
                <Input
                  name="username"
                  placeholder="Enter your username"
                  type="text"
                  minLength={3}
                  required
                  disabled={loading}
                  onChange={handleChange}
                  className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Email Address
                  <span className="ml-2 text-red-500">*</span>
                </label>
                <Input
                  name="email"
                  placeholder="your.email@example.com"
                  type="email"
                  required
                  disabled={loading}
                  onChange={handleChange}
                  className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Grade
                  <span className="ml-2 text-red-500">*</span>
                </label>
                <Select
                  onValueChange={(v: any) => setData({ ...data, grade: v })}
                  disabled={loading}
                  required
                >
                  <SelectTrigger className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="Select your grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g} value={g}>
                        {gradeLabels[g]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Major
                  <span className="ml-2 text-red-500">*</span>
                </label>
                <Select
                  onValueChange={(v: any) => setData({ ...data, major: v })}
                  disabled={loading}
                  required
                >
                  <SelectTrigger className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="Select your major" />
                  </SelectTrigger>
                  <SelectContent>
                    {majors.map((m) => (
                      <SelectItem key={m} value={m}>
                        {majorLabels[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Class Number
                  <span className="ml-2 text-red-500">*</span>
                </label>
                <Select
                  onValueChange={(v: any) =>
                    setData({ ...data, classNumber: v })
                  }
                  disabled={loading}
                  required
                >
                  <SelectTrigger className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="Select class number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>

                    {classNumbers.map((num) => (
                      <SelectItem key={num} value={String(num)}>
                        Class {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Homeroom Teacher
                  <span className="ml-2 text-red-500">*</span>
                </label>
                <Select
                  onValueChange={(v: any) =>
                    setData({ ...data, teacherName: v })
                  }
                  disabled={loading}
                  required
                >
                  <SelectTrigger className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <SelectValue placeholder="Select your teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Password
                  <span className="ml-2 text-red-500">*</span>
                </label>
                <Input
                  name="password"
                  placeholder="Minimum 8 characters"
                  type="password"
                  minLength={8}
                  required
                  disabled={loading}
                  onChange={handleChange}
                  className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Confirm Password
                  <span className="ml-2 text-red-500">*</span>
                </label>
                <Input
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  type="password"
                  minLength={8}
                  required
                  disabled={loading}
                  onChange={handleChange}
                  className="h-12 border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                className="w-full h-14 bg-gradient-to-r  from-[#FBBF24] to-[#ffbc12] hover:from-[#FBBF24] hover:to-[#fdb808] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStudentAccount;
