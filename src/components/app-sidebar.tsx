import {
  IconDashboard,
  IconFileDescription,
  IconListDetails,
  IconPackage,
  IconTruck,
  IconMap,
  IconBottle,
  IconInnerShadowTop,
  IconSettings,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
interface AppSidebarProps {
  onNavigate?: (page: string) => void;
}

export function AppSidebar({ onNavigate, ...props }: AppSidebarProps) {
  const data = {
    user: {
      name: "PickPackPro",
      email: "admin@pickpackpro.com",
      avatar: "/avatars/admin.jpg",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "dashboard",
        icon: IconDashboard,
      },
      {
        title: "Products",
        url: "products",
        icon: IconPackage,
      },
      {
        title: "Providers",
        url: "providers",
        icon: IconTruck,
      },
      {
        title: "Pick & Pack",
        url: "orders",
        icon: IconListDetails,
      },
      {
        title: "Map",
        url: "map",
        icon: IconMap,
      },
      {
        title: "Generate Order",
        url: "generate-order",
        icon: IconFileDescription,
      },
      {
        title: "Alcohol Bottles",
        url: "alcohol-bottles",
        icon: IconBottle,
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "#",
        icon: IconSettings,
      },
    ],
  }
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">PickPackPro</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}