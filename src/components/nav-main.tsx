import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { useNavigation } from "@/contexts/NavigationContext"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    onClick?: () => void
    external?: boolean
  }[]
}) {
  const { setCurrentPage } = useNavigation()
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.title}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick()
                  } else if (item.external) {
                    window.open(item.url, '_blank', 'noopener,noreferrer')
                  } else if (item.url !== '#') {
                    setCurrentPage(item.url)
                  }
                }}
                asChild={!item.onClick && item.url === '#' && !item.external}
              >
                {item.onClick || (item.url !== '#' && !item.external) ? (
                  <>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </>
                ) : (
                  <a href={item.url} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
