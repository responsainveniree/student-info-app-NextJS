import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex flex-col h-screen items-center justify-center">
      <Spinner />
      Loading...
    </div>
  );
}
