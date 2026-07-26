"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderOpen,
  Folder,
  ChevronRight,
  Video,
  Image as ImageIcon,
  Music,
  Boxes,
  CalendarDays,
  ListChecks,
  ChefHat,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NavUser } from "@/components/layout/nav-user";
import { StorageMeter, STORAGE_LIMIT_BYTES } from "@/features/files/components/storage-meter";
import { useFullScreen } from "@/components/layout/fullscreen-provider";

const topItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Uploaded Files", url: "/dashboard/files", icon: FolderOpen },
];

const mediaItems = [
  { title: "Videos", url: "/dashboard/videos", icon: Video },
  { title: "Photos", url: "/dashboard/photos", icon: ImageIcon },
  { title: "Audio", url: "/dashboard/audio", icon: Music },
  { title: "Other", url: "/dashboard/other", icon: Boxes },
];

const bottomItems = [
  { title: "Calendar", url: "/dashboard/calendar", icon: CalendarDays },
  { title: "To-Do List", url: "/dashboard/todos", icon: ListChecks },
  { title: "Meals", url: "/dashboard/meals", icon: ChefHat },
  { title: "Shared Links", url: "/dashboard/shared-links", icon: Link2 },
  { title: "Activity", url: "/dashboard/activity", icon: Activity },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar({
  user,
  usedBytes,
}: {
  user: { name: string; email: string };
  usedBytes: number;
}) {
  const pathname = usePathname();
  const isMediaActive = mediaItems.some((item) => pathname.startsWith(item.url));
  const [isMediaOpen, setIsMediaOpen] = useState(isMediaActive);
  const { isFullScreen } = useFullScreen();

  if (isFullScreen) return null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pb-0">
        <div className="flex items-center justify-center pt-3 pb-1 group-data-[collapsible=icon]:py-1">
          <Image
            src="/logo.png"
            alt="SagarsMegaDrive"
            width={240}
            height={240}
            className="rounded-lg group-data-[collapsible=icon]:size-7"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {topItems.map((item) => {
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
                      className="h-10 text-base [&_svg]:size-5"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setIsMediaOpen((open) => !open)}
                  isActive={isMediaActive && !isMediaOpen}
                  tooltip="Media"
                  className="h-10 text-base [&_svg]:size-5"
                >
                  <Folder />
                  <span>Media</span>
                  <ChevronRight
                    className={cn(
                      "ml-auto size-4! transition-transform",
                      isMediaOpen && "rotate-90"
                    )}
                  />
                </SidebarMenuButton>
                {isMediaOpen && (
                  <SidebarMenuSub>
                    {mediaItems.map((item) => {
                      const isActive = pathname.startsWith(item.url);
                      return (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            render={<Link href={item.url} />}
                            isActive={isActive}
                            className="h-9 text-base [&_svg]:size-4"
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {bottomItems.map((item) => {
                const isActive = pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className="h-10 text-base [&_svg]:size-5"
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
        <StorageMeter usedBytes={usedBytes} limitBytes={STORAGE_LIMIT_BYTES} />
        <NavUser name={user.name} email={user.email} />
      </SidebarFooter>
    </Sidebar>
  );
}
