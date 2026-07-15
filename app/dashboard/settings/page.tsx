import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TwoFactorSetup } from "@/features/auth/components/two-factor-setup";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Protect your administrator account.</CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorSetup initiallyEnabled={Boolean(session?.user.twoFactorEnabled)} />
        </CardContent>
      </Card>

      <ComingSoon
        title="Site & storage settings"
        description="Website title, logo, accent colour, default share expiry, storage quota, and session timeout arrive in Milestone 5."
      />
    </div>
  );
}
