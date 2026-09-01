import { useAuthState } from "react-firebase-hooks/auth";

import { Auth } from "@/components/auth";
import { Spinner } from "@/components/ui/spinner";
import { firebaseAuth } from "@/lib/firebase";

function App() {
  const [user, loading] = useAuthState(firebaseAuth);

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <h1 className="text-3xl font-bold underline">Connected</h1>;
}

export default App;
