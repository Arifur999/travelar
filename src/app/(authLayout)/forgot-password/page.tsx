import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/modules/Auth/AuthCard";
import ForgotPasswordForm from "@/components/modules/Auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Get a link to reset your Travelar password.",
};

const ForgotPasswordPage = () => (
  <AuthCard
    title="Forgot your password?"
    description="Enter the email you sign in with and we will send you a reset link."
  >
    <ForgotPasswordForm />

    <p className="text-center text-sm text-muted-foreground">
      Remembered it?{" "}
      <Link href="/login" className="font-medium text-primary hover:underline">
        Sign in
      </Link>
    </p>
  </AuthCard>
);

export default ForgotPasswordPage;
