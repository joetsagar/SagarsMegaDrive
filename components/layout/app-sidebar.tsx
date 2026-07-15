"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderOpen,
  Video,
  Image as ImageIcon,
  FileText,
  Link2,
  Activity,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "@/components/layout/nav-user";

const navItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Files", url: "/dashboard/files", icon: FolderOpen },
  { title: "Videos", url: "/dashboard/videos", icon: Video },
  { title: "Photos", url: "/dashboard/photos", icon: ImageIcon },
  { title: "Documents", url: "/dashboard/documents", icon: FileText },
  { title: "Shared Links", url: "/dashboard/shared-links", icon: Link2 },
  { title: "Activity", url: "/dashboard/activity", icon: Activity },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-md" />
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            SagarsMegaDrive
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.url === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser name={user.name} email={user.email} />
      </SidebarFooter>
    </Sidebar>
  );
}
