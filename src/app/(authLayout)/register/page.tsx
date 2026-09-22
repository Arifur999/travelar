import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/modules/Auth/AuthCard";
import RegisterForm from "@/components/modules/Auth/RegisterForm";

export const metadata: Metadata = {
  title: "Start a free trial",
  description: "Create your Travelar agency workspace and start a free trial.",
};

const RegisterPage = () => (
  <AuthCard
    title="Start a free trial"
    description="Create your agency workspace. Every module is unlocked during the trial."
  >
    <RegisterForm />

    <p className="text-center text-sm text-muted-foreground">
      Already have an account?{" "}
      <Link href="/login" className="font-medium text-primary hover:underline">
        Sign in
      </Link>
    </p>
  </AuthCard>
);

export default RegisterPage;
