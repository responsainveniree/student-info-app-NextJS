import LandingPage from "@/components/landing-page/LandingPage";
import { auth } from "@/lib/auth/authNode";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SMK Advent",
  description: "SMK Advent",

  verification: {
    google: "googlec2021259fa231b99",
  },

  openGraph: {
    title: "SMK Advent",
    description: "SMK Advent",
    url: "https://smk-advent.vercel.app",
    siteName: "SMK Advent",
    type: "website",
  },
};

const page = async () => {
  const session = await auth();

  return <LandingPage session={session?.user} />;
};

export default page;
