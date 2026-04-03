"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CLASS_SECTION,
  ClassSection,
  Grade,
  GRADES,
  Major,
  MAJORS,
} from "@/lib/constants/class";
import {
  GRADE_DISPLAY_MAP,
  MAJOR_DISPLAY_MAP,
  STUDENT_ROLES_MAP,
} from "@/lib/utils/labels";
import {
  STUDENT_POSITIONS_ARRAY,
  StudentPosition,
} from "@/lib/constants/roles";
import { Button } from "@react-email/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import {
  updateStudentProfileSchema,
  UpdateStudentProfileSchema,
} from "@/lib/zod/student";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useUpdateStudent } from "@/services/student/student-hooks";
import LoadingFullScreen from "@/components/ui/LoadingFullScreen";

interface EditStudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
}

const EditStudentFormModal = ({
  open,
  onOpenChange,
  userId,
  username,
}: EditStudentFormModalProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm<UpdateStudentProfileSchema>({
    resolver: zodResolver(updateStudentProfileSchema),
    defaultValues: {
      id: userId,
      name: "",
      email: "",
      passwordSchema: {
        password: "",
        confirmPassword: "",
      },
      classSchema: {
        grade: "" as Grade,
        major: "" as Major,
        section: "" as ClassSection,
      },
      role: "" as StudentPosition,
    },
  });

  const updateStudentMutation = useUpdateStudent();

  const handleUpdateUser = (data: UpdateStudentProfileSchema) => {
    updateStudentMutation.mutate(data);
  };

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      reset({
        id: userId,
        name: "",
        email: "",
        passwordSchema: { password: "", confirmPassword: "" },
        classSchema: {
          grade: "" as Grade,
          major: "" as Major,
          section: "" as ClassSection,
        },
        role: "" as StudentPosition,
      });
    }
  }, [open, userId, reset]);

  return (
    <>
      {updateStudentMutation.isPending ? LoadingFullScreen() : ""}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[70vw]">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-center">
              Student Profile Edit Form
            </DialogTitle>

            <div>
              <form
                className="space-y-6"
                onSubmit={handleSubmit(handleUpdateUser)}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">
                    {username}'s Personal Information
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* <div className="space-y-2 hidden">
                    <Input
                      {...register("id")}
                      className="h-11"
                      placeholder="Minumun 3 characters"
                      required
                      readOnly
                      value={userId}
                    />
                  </div> */}

                  <div className="space-y-2">
                    <Field data-invalid={!!errors.name}>
                      <FieldLabel>
                        Name <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...register("name")}
                        className="h-11"
                        placeholder="Minumun 3 characters"
                        required
                      />
                      {errors.name && <FieldError errors={[errors.name]} />}
                    </Field>
                  </div>

                  <div className="space-y-2">
                    <Field data-invalid={!!errors.email}>
                      <FieldLabel>
                        Email <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        {...register("email")}
                        className="h-11"
                        placeholder="example@gmail.com"
                        required
                      />
                      {errors.name && <FieldError errors={[errors.email]} />}
                    </Field>
                  </div>

                  <div className="space-y-2">
                    <Controller
                      name="classSchema.grade"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Grade <span className="text-red-500">*</span>
                          </FieldLabel>

                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADES.map((g) => (
                                <SelectItem key={g} value={g}>
                                  {GRADE_DISPLAY_MAP[g]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Controller
                      name="classSchema.major"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Major <span className="text-red-500">*</span>
                          </FieldLabel>

                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select Major" />
                            </SelectTrigger>
                            <SelectContent>
                              {MAJORS.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {MAJOR_DISPLAY_MAP[m]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Controller
                      name="classSchema.section"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Class Section{" "}
                            <span className="text-red-500">*</span>
                          </FieldLabel>

                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select class section" />
                            </SelectTrigger>
                            <SelectContent>
                              {CLASS_SECTION.map((num) => (
                                <SelectItem key={num} value={num}>
                                  {num === "none" ? "None" : `Class ${num}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Controller
                      name="role"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>
                            Student Role <span className="text-red-500">*</span>
                          </FieldLabel>

                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select class section" />
                            </SelectTrigger>
                            <SelectContent>
                              {STUDENT_POSITIONS_ARRAY.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {STUDENT_ROLES_MAP[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>

                  <Field data-invalid={!!errors.passwordSchema?.root}>
                    <FieldLabel>Password</FieldLabel>

                    <div className="relative">
                      <Input
                        {...register("passwordSchema.password")}
                        className="h-11 pr-10"
                        placeholder="Minimum 3 characters"
                        type={showPassword ? "text" : "password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Error message di luar div relative */}
                    {errors.passwordSchema?.root && (
                      <FieldError errors={[errors.passwordSchema?.root]} />
                    )}
                  </Field>

                  <Field data-invalid={!!errors.passwordSchema?.root}>
                    <FieldLabel>Confirm Password</FieldLabel>

                    <div className="relative">
                      <Input
                        {...register("passwordSchema.confirmPassword")}
                        className="h-11 pr-10"
                        placeholder="Minimum 3 characters"
                        type={showConfirmPassword ? "text" : "password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Error message di luar div relative */}
                    {errors.passwordSchema?.root && (
                      <FieldError errors={[errors.passwordSchema?.root]} />
                    )}
                  </Field>
                </div>

                {/* Submit Button */}
                <button
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-lg rounded-xl shadow-lg flex items-center justify-center"
                  type="submit"
                  disabled={updateStudentMutation.isPending}
                >
                  {updateStudentMutation.isPending ? (
                    <>
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
                      Editing Profile...
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-5 h-5 mr-2" />
                      <span>Edit Student Profile</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditStudentFormModal;
