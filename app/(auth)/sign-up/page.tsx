import { GoogleSignIn } from "@/components/auth/GoogleSignin";
import SignUp from "@/components/auth/SignUp";

const Page = () => {
  return (
    <div className="w-full h-screen bg-gray-300">
      <div className="flex flex-col h-full max-w-md justify-center mx-auto">
        <div className="shadow-md p-4 space-y-6 bg-white rounded-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            Create Account
          </h1>

          <GoogleSignIn />

          <SignUp />
        </div>
      </div>
    </div>
  );
};

export default Page;
