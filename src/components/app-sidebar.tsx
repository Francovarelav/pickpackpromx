import * as React from "react"
import {
  IconCamera,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconTrack,
  IconUsers,
  IconPackage,
  IconTruck,
  IconChartLine,
  IconUserCheck,
  IconBottle,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "dashboard",
      icon: IconDashboard,
    },
    {
      title: "Generate order",
      url: "generate-order",
      icon: IconListDetails,
    },
    {
      title: "Products",
      url: "products",
      icon: IconPackage,
    },
    {
      title: "Visual Map Creator",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Indication Assistant",
      url: "#",
      icon: IconUsers,
    },
    {
      title: "Order Tracking",
      url: "order-tracking",
      icon: IconTrack,
    },
    //inventory management
    {
      title: "Inventory Management",
      url: "#",
      icon: IconPackage,
    },
    // proveedores
    {
      title: "Providers",
      url: "providers",
      icon: IconBuildingStore,
    },
    // aerolineas
    {
      title: "Airlines",
      url: "airlines",
      icon: IconPlane,
    },
    // empleados
    {
      title: "Employees",
      url: "employees",
      icon: IconUsers,
    },
    // ordenes de proveedores
    {
      title: "Supplier Orders",
      url: "#",
      icon: IconTruck,
    },
    // empleados analytics
    {
      title: "Employee Analytics",
      url: "#",
      icon: IconChartLine,
    },
    // marketing analytics
    {
      title: "Employee Management",
      url: "#",
      icon: IconUserCheck,
    },
    // control botellas
    {
      title: "Control Bottles Waste",
      url: "#",
      icon: IconBottle,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ onNavigate, ...props }: AppSidebarProps) {
  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
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
        title: "Generate order",
        url: "generate-order",
        icon: IconFileDescription,
      },
      {
        title: "Visual Map Creator",
        url: "#",
        icon: IconFolder,
      },
      {
        title: "Indication Assistant",
        url: "#",
        icon: IconUsers,
      },
      {
        title: "Order Tracking",
        url: "#",
        icon: IconTrack,
        onClick: () => onNavigate?.('order-tracking'),
      },
      {
        title: "Inventory Management",
        url: "#",
        icon: IconPackage,
      },
      {
        title: "Supplier Orders",
        url: "#",
        icon: IconTruck,
      },
      {
        title: "Employee Analytics",
        url: "#",
        icon: IconChartLine,
      },
      {
        title: "Employee Management",
        url: "#",
        icon: IconUserCheck,
      },
      {
        title: "Control Bottles Waste",
        url: "#",
        icon: IconBottle,
      },
    ],
    navClouds: [
      {
        title: "Capture",
        icon: IconCamera,
        isActive: true,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
      {
        title: "Proposal",
        icon: IconFileDescription,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
      {
        title: "Prompts",
        icon: IconFileAi,
        url: "#",
        items: [
          {
            title: "Active Proposals",
            url: "#",
          },
          {
            title: "Archived",
            url: "#",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Settings",
        url: "#",
        icon: IconSettings,
      },
      {
        title: "Get Help",
        url: "#",
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "#",
        icon: IconSearch,
      },
    ],
    documents: [
      {
        name: "Data Library",
        url: "#",
        icon: IconDatabase,
      },
      {
        name: "Reports",
        url: "#",
        icon: IconReport,
      },
      {
        name: "Word Assistant",
        url: "#",
        icon: IconFileWord,
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
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}