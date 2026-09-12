import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/modules/Auth/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Travelar agency workspace.",
};

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await searchParams;
  const redirectParam = typeof params.redirect === "string" ? params.redirect : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Enter your credentials to reach your workspace.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <LoginForm redirectTo={redirectParam} />

        <p className="text-center text-sm text-muted-foreground">
          New agency?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Start a free trial
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

export default LoginPage;
