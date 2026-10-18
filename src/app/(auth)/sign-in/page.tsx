import type { Metadata } from "next";
import { SignInScreen } from "@/features/session/components/SignInScreen";

export const metadata: Metadata = { title: "Sign in · Keyway" };

export default function SignInPage() {
  return <SignInScreen />;
}
