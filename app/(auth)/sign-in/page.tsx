import { auth } from "@/lib/auth/authNode";
import { signIn } from "@/lib/auth/authNode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeAction } from "@/lib/actions/executeActions";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="w-full h-screen bg-gray-300">
      <div className="flex flex-col h-full max-w-md justify-center mx-auto ">
        <div className="shadow-md p-4 space-y-6 bg-white rounded-md">
          <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

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

          {/* Email/Password Sign In */}
          <form
            className="space-y-4"
            action={async (formData) => {
              "use server";
              await executeAction({
                actionFn: async () => {
                  await signIn("credentials", formData);
                },
              });
            }}
          >
            <Input name="email" placeholder="Email" type="email" required />
            <Input
              name="password"
              placeholder="Password"
              type="password"
              required
            />

            <Button className="w-full cursor-pointer" type="submit">
              Sign In
            </Button>
          </form>

          <div className="text-center">
            <Button asChild variant="link">
              <Link href="/sign-up">Don&apos;t have an account? Sign up</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
