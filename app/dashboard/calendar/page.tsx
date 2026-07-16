import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarView } from "@/features/calendar/components/calendar-view";

export default async function CalendarPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  const events = await db.calendarEvent.findMany({
    where: { userId: session!.user.id },
    orderBy: { startAt: "asc" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <CalendarView events={events} />
      </CardContent>
    </Card>
  );
}
