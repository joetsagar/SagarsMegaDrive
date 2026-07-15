import { ComingSoon } from "@/components/layout/coming-soon";

export default function DashboardHomePage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ComingSoon
        title="Storage usage"
        description="Used/remaining storage and quota warnings arrive in Milestone 3."
      />
      <ComingSoon
        title="Recent uploads"
        description="A feed of recently uploaded files arrives in Milestone 2."
      />
      <ComingSoon
        title="Recently shared"
        description="A feed of recently created share links arrives in Milestone 3."
      />
      <ComingSoon
        title="Quick upload / Create folder"
        description="Drag-and-drop upload and folder creation arrive in Milestone 2."
      />
    </div>
  );
}
