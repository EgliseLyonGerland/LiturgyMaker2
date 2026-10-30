import { ChurchIcon, ListMusicIcon, LogOutIcon, MessageSquareTextIcon } from "lucide-react";
import { ChevronsUpDownIcon } from "lucide-react";
import * as React from "react";
import { useSignOut } from "react-firebase-hooks/auth";
import { NavLink, useLocation, useNavigate } from "react-router";

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
  SidebarRail,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CurrentUser } from "@/lib/current-user";
import { firebaseAuth } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/user-context";

import { ThemeSwitcherDropdownMenuGroup } from "./theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "./ui/toast";

const navItems = [
  {
    title: "Présidences",
    to: "/liturgies",
    icon: <ChurchIcon />,
  },
  {
    title: "Chants",
    to: "/songs",
    icon: <ListMusicIcon />,
  },
  {
    title: "Récitations",
    to: "/recitations",
    icon: <MessageSquareTextIcon />,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useCurrentUser();

  const location = useLocation();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-0">
        <a className="group mb-4 flex h-16 cursor-pointer items-center gap-4 border-b px-4 hover:bg-black/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 43 43"
            className="size-6 fill-indigo-500 dark:fill-foreground"
          >
            <path d="M25.4004 0C26.6142 1.06189e-10 27.7085 0.00254486 28.7012 0.0117188C28.6474 0.851736 28.5561 1.69424 28.4209 2.53613C28.1108 4.50969 27.575 6.40083 26.8555 8.19336C26.3773 9.37057 26.9482 10.7111 28.123 11.1885C29.3002 11.6668 30.6408 11.0968 31.1182 9.92188L31.1191 9.91895C31.9663 7.8007 32.5945 5.56477 32.96 3.25488C33.1218 2.24124 33.2317 1.22633 33.293 0.213867C34.7969 0.379875 35.9652 0.674932 36.9941 1.19922C39.0637 2.25378 40.7462 3.93632 41.8008 6.00586C42.3209 7.02655 42.6145 8.18446 42.7812 9.6709C41.9687 9.72545 41.1549 9.81424 40.3418 9.93848L39.7715 10.0312C33.4519 11.1286 27.8164 14.246 23.6152 18.8428C22.7488 19.7834 22.8278 21.2357 23.7598 22.0947C24.7003 22.9614 26.1518 22.8824 27.0107 21.9502L27.0117 21.9492C30.4217 18.2248 34.9553 15.6501 40.0635 14.6602L40.5596 14.5693L41.1807 14.4707C41.7829 14.3814 42.3856 14.3171 42.9873 14.2734C42.9967 15.2728 43 16.3754 43 17.5996V20.5117C42.5748 20.609 42.1462 20.6986 41.7129 20.7734L41.7119 20.7744C38.0629 21.4085 34.3714 21.1965 30.8926 20.1963C29.6598 19.8317 28.3941 20.5514 28.0459 21.7607C27.6807 22.9935 28.4005 24.2585 29.6094 24.6074C33.7516 25.8079 38.1422 26.0576 42.4863 25.3115C42.6578 25.2817 42.8296 25.2495 43 25.2168V25.4004C43 27.0464 42.9985 28.4725 42.9756 29.7236C42.1411 29.6697 41.3041 29.5787 40.4678 29.4443H40.4658C38.4922 29.1341 36.6021 28.5979 34.8096 27.8779C33.6331 27.4015 32.2935 27.9716 31.8164 29.1455C31.3383 30.3227 31.9082 31.6641 33.083 32.1416L33.0859 32.1426C35.2041 32.99 37.4402 33.6188 39.75 33.9844C40.7138 34.1383 41.6787 34.2447 42.6416 34.3076C42.464 35.3421 42.2008 36.209 41.8008 36.9941C40.7462 39.0637 39.0637 40.7462 36.9941 41.8008C35.9452 42.3352 34.7515 42.6308 33.2051 42.7949C33.1561 42.3142 33.0968 41.8332 33.0234 41.3525L32.9307 40.7822L32.8213 40.1914C31.6387 34.1208 28.5834 28.7128 24.1436 24.6445L24.1494 24.6377C23.2089 23.771 21.7574 23.85 20.8984 24.7822C20.032 25.7228 20.1102 27.1741 21.042 28.0332L21.043 28.0342C24.7668 31.4449 27.3413 35.9796 28.3311 41.0889L28.4219 41.585L28.5215 42.2109C28.5599 42.4703 28.5931 42.7289 28.623 42.9883C27.6512 42.9968 26.5825 43 25.4004 43H22.2686C22.2525 42.9127 22.2339 42.8259 22.2188 42.7383C21.585 39.0757 21.7962 35.3998 22.7949 31.9219C23.1638 30.686 22.4564 29.4346 21.2363 29.0703C20.0021 28.702 18.7338 29.4222 18.3848 30.6328C17.2316 34.6134 16.9597 38.8224 17.6016 43H17.5996C15.9924 43 14.5949 42.9988 13.3652 42.9775C13.4169 42.4732 13.4834 41.9685 13.5645 41.4639C13.8746 39.4896 14.41 37.5968 15.1299 35.8037C15.6063 34.6271 15.0364 33.2886 13.8623 32.8115C12.6852 32.3333 11.3445 32.9032 10.8672 34.0781L10.8662 34.0811C10.0191 36.1993 9.39088 38.4353 9.02539 40.7451C8.92369 41.382 8.84307 42.0194 8.78125 42.6562C7.70738 42.4787 6.81334 42.2122 6.00586 41.8008C3.93632 40.7462 2.25378 39.0637 1.19922 36.9941C0.788999 36.189 0.521277 35.2982 0.34375 34.2285C0.967121 34.1618 1.59091 34.0766 2.21387 33.9688C8.53382 32.8713 14.1699 29.7534 18.3711 25.1562L18.3701 25.1553C19.2356 24.2146 19.1573 22.764 18.2256 21.9053C17.285 21.0388 15.8335 21.1176 14.9746 22.0498L14.9736 22.0508C11.4536 25.8954 6.73647 28.5149 1.42578 29.4307L0.804688 29.5293C0.543662 29.568 0.282514 29.6017 0.0214844 29.6318C0.000242941 28.4029 1.36101e-10 27.0063 0 25.4004V23.2803C0.0956522 23.2626 0.191074 23.2431 0.287109 23.2266L0.288086 23.2256C3.93703 22.5915 7.62769 22.8026 11.1064 23.8027C12.3397 24.1682 13.6049 23.4481 13.9531 22.2383C14.318 21.0053 13.599 19.74 12.3896 19.3916L12.1064 19.3096L12.0742 19.3408C8.18032 18.2565 4.07555 18.0099 0 18.6357V17.5996C1.06791e-10 16.4088 0.00208085 15.3331 0.0107422 14.3555C0.517673 14.4073 1.02501 14.4742 1.53223 14.5557H1.53418C3.50783 14.8659 5.39785 15.4021 7.19043 16.1221C8.36718 16.5994 9.70635 16.0288 10.1836 14.8545C10.6617 13.6773 10.0918 12.3359 8.91699 11.8584L8.91406 11.8574C6.92515 11.0617 4.83211 10.4611 2.67188 10.0879V10.0693L2.25098 10.002C1.57083 9.8933 0.890091 9.80829 0.209961 9.74512C0.375183 8.22286 0.670518 7.04349 1.19922 6.00586C2.25378 3.93632 3.93632 2.25378 6.00586 1.19922C6.78709 0.801162 7.64908 0.536992 8.67676 0.359375C8.74581 1.3071 8.86236 2.25632 9.02637 3.2041C10.1236 9.52513 13.2406 15.1613 17.8369 19.3633C18.7775 20.2291 20.2282 20.1497 21.0869 19.2178C21.9535 18.2772 21.8753 16.8259 20.9434 15.9668L20.9424 15.9658L20.5859 15.6318C17.0543 12.2615 14.6121 7.8557 13.6543 2.91113L13.5635 2.41504L13.4639 1.78906C13.3767 1.20048 13.314 0.611468 13.2705 0.0234375C14.523 0.000456557 15.951 1.43287e-10 17.5996 0H19.5078C19.604 0.421669 19.6924 0.846757 19.7666 1.27637C20.3611 4.7116 20.2129 8.15816 19.3682 11.4424L19.1895 12.0977C18.824 13.3318 19.5307 14.5795 20.749 14.9434C21.9837 15.312 23.2519 14.5912 23.6006 13.3799C24.8005 9.23732 25.0496 4.84737 24.3037 0.50293L24.2109 0H25.4004Z" />
          </svg>

          <span>Gestion du culte</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    isActive={location.pathname.startsWith(item.to)}
                    render={
                      <NavLink to={item.to}>
                        {item.icon} {item.title}
                      </NavLink>
                    }
                  ></SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Footer user={user} />
      <SidebarRail />
    </Sidebar>
  );
}

interface FooterProps {
  user: CurrentUser;
}

function Footer({ user }: FooterProps) {
  const isMobile = useIsMobile();
  const [signOut] = useSignOut(firebaseAuth);
  const navigate = useNavigate();

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                />
              }
            >
              <div className="grid flex-1 gap-0.5 text-left text-sm leading-tight">
                {user.profile && (
                  <span className="truncate font-medium">Hey, {user.profile.firstName} !</span>
                )}
                <span className="truncate text-xs text-muted-foreground">{user.auth.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      {user.profile && (
                        <span className="truncate font-medium">
                          {user.profile.firstName} {user.profile.lastName}
                        </span>
                      )}
                      <span className="truncate text-xs">{user.auth.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <ThemeSwitcherDropdownMenuGroup />
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => {
                    navigate("/logout");
                  }}
                >
                  <LogOutIcon />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
