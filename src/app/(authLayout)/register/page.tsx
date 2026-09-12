import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/modules/Auth/RegisterForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Start a free trial",
  description: "Create your Travelar agency workspace and start a free trial.",
};

const RegisterPage = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Start a free trial</CardTitle>
      <CardDescription>
        Create your agency workspace. Every module is unlocked during the trial.
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-6">
      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </CardContent>
  </Card>
);

export default RegisterPage;
