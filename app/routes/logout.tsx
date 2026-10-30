import { signOut } from "firebase/auth";
import { redirect } from "react-router";

import { firebaseAuth } from "@/lib/firebase";

export async function clientLoader() {
  await signOut(firebaseAuth);
  return redirect("/auth");
}

export default function Logout() {
  return null;
}
