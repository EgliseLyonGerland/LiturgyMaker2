import { Spinner } from "@/components/ui/spinner";

export function LoadingScreen() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-3">
      <Spinner className="size-8" aria-label="Chargement en cours" />
    </div>
  );
}
