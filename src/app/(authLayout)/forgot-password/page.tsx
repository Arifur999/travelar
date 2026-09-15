import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "@/components/modules/Auth/ForgotPasswordForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Get a link to reset your Travelar password.",
};

const ForgotPasswordPage = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl">Forgot your password?</CardTitle>
      <CardDescription>Enter the email you sign in with and we will send you a reset link.</CardDescription>
    </CardHeader>

    <CardContent className="space-y-6">
      <ForgotPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </CardContent>
  </Card>
);

export default ForgotPasswordPage;
