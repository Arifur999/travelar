import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/modules/Auth/ResetPasswordForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Travelar account.",
  // The URL carries a live reset token; keep it out of any index.
  robots: { index: false, follow: false },
};

const ResetPasswordPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  // Whether the token is still valid is only known when it is used — checking
  // it here would spend nothing but would tell a stranger whether a link is
  // live. A missing token, though, can never work.
  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">This link is incomplete</CardTitle>
          <CardDescription>
            Open the reset link from your email again, or request a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>This link works once and expires an hour after it was sent.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <ResetPasswordForm token={token} />

        <p className="text-center text-sm text-muted-foreground">
          Link expired?{" "}
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordPage;
