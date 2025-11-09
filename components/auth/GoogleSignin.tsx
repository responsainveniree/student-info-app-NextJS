import { signIn } from "@/lib/auth/authNode";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "../ui/googleIcon";
const GoogleSignIn = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <Button className="w-full" variant="outline">
        <GoogleIcon />
        Continue with Google
      </Button>
    </form>
  );
};

export { GoogleSignIn };
