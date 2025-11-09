// import { signUp } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GoogleSignIn } from "@/components/auth/GoogleSignin";
import { auth } from "@/lib/auth/authNode";

const Page = async () => {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="w-full h-screen bg-gray-300">
      <div className="flex flex-col h-full max-w-md justify-center mx-auto ">
        <div className="shadow-md p-4 space-y-6 bg-white rounded-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            Create Account
          </h1>

          <div className="cursor-pointer">
            <GoogleSignIn />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Sign Up */}
          <form
            className="space-y-4"
            action={async (formData) => {
              "use server";
            }}
          >
            <Input
              name="username"
              placeholder="text"
              type="username"
              min={3}
              required
            />
            <Input name="email" placeholder="Email" type="email" required />
            <Input
              name="password"
              placeholder="Password"
              type="password"
              required
              min={8}
            />
            <Input
              name="confirmPassword"
              placeholder="confirm password"
              type="password"
              min={8}
              required
            />

            <Button className="w-full cursor-pointer" type="submit">
              Sign Up
            </Button>
          </form>

          <div className="text-center">
            <Button asChild variant="link">
              <Link href="/sign-in">Already have an account? Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
