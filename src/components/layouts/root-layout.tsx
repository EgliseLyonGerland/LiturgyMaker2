import { useAuthState } from "react-firebase-hooks/auth";
import { Outlet } from "react-router";

import { firebaseAuth } from "@/lib/firebase";

import { AuthRoute } from "../routes/auth-route";
import { Spinner } from "../ui/spinner";

function RootLayout() {
  const [user, loading] = useAuthState(firebaseAuth);

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!user) {
    return <AuthRoute />;
  }

  return <Outlet />;
}

export { RootLayout };
