import type { Metadata } from "next";
import ChangePasswordForm from "@/components/modules/Auth/ChangePasswordForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserInfo } from "@/services/auth.services";

export const metadata: Metadata = { title: "Change password" };

const ChangePasswordPage = async () => {
  const userInfo = await getUserInfo();

  return (
    <div className="mx-auto w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            {userInfo?.needPasswordChange
              ? "Your account requires a new password before you can continue."
              : "Pick a new password for your account."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
