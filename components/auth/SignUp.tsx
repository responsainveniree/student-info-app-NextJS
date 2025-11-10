"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

const SignUp = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("/api/auth/signup", data, {
        withCredentials: true,
      });
      router.push("/sign-in");
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Input
          name="username"
          placeholder="Username"
          type="text"
          minLength={3}
          required
          disabled={loading}
          onChange={handleChange}
        />
        <Input
          name="email"
          placeholder="Email"
          type="email"
          required
          disabled={loading}
          onChange={handleChange}
        />
        <Input
          name="password"
          placeholder="Password"
          type="password"
          minLength={8}
          required
          disabled={loading}
          onChange={handleChange}
        />
        <Input
          name="confirmPassword"
          placeholder="Confirm Password"
          type="password"
          minLength={8}
          required
          disabled={loading}
          onChange={handleChange}
        />

        <Button
          className="w-full cursor-pointer"
          type="submit"
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign Up"}
        </Button>
      </form>

      <div className="text-center">
        <Button asChild variant="link">
          <Link href="/sign-in">Already have an account? Sign in</Link>
        </Button>
      </div>
    </div>
  );
};

export default SignUp;
