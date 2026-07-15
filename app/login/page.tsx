import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-0 p-6">
      <Image
        src="/logo.png"
        alt="SagarsMegaDrive"
        width={960}
        height={960}
        priority
        className="h-auto w-[32rem] max-w-[90vw]"
      />
      <Card className="w-full max-w-sm">
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
