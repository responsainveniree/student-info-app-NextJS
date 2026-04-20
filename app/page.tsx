import LandingPage from "@/components/landing-page/LandingPage";
import { auth } from "@/lib/auth/authNode";
import { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://smk-advent.vercel.app"),
  title:
    "Portal Siswa SMK Advent Batam | Portal Resmi Sekolah & Informasi Siswa",
  description:
    "Portal resmi SMK Advent Batam untuk informasi siswa seputar nilai, absensi, dan poin pelanggaran.",

  verification: {
    google: "googlec2021259fa231b99",
  },

  keywords: [
    "portal siswa SMK Advent Batam",
    "aplikasi siswa SMK Advent Batam",
    "login siswa SMK Advent Batam",
    "sistem informasi siswa SMK Advent Batam",
    "website siswa SMK Advent Batam",
    "cara login portal siswa SMK Advent Batam",
  ],

  openGraph: {
    title: "SMK Advent Batam | Portal Resmi Sekolah & Informasi Siswa",
    description:
      "Portal resmi SMK Advent Batam untuk informasi siswa seputar nilai, absensi, dan poin pelanggaran.",
    url: "https://smk-advent.vercel.app",
    siteName: "SMK Advent Batam",
    type: "website",
  },
};

const page = async () => {
  const session = await auth();

  return <LandingPage session={session?.user} />;
};

export default page;
