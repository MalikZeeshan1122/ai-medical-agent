import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  Heart,
  Home,
  Pill,
  Stethoscope,
  Users,
  AlertCircle,
  BookOpen,
  BarChart3,
  MessageSquare,
  Phone,
  Brain,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const patientItems = [
  { title: "AI Chat", url: "/", icon: MessageSquare },
  { title: "Private AI Assistant", url: "/ai-chat", icon: Brain },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Find Doctors", url: "/doctors", icon: Users },
  { title: "Hospitals", url: "/hospitals", icon: Stethoscope },
  { title: "Medical History", url: "/medical-history", icon: FileText },
  { title: "Symptom Tracker", url: "/symptom-tracker", icon: Activity },
  { title: "Medications", url: "/medications", icon: Pill },
  { title: "Health Resources", url: "/resources", icon: BookOpen },
];

const doctorItems = [
  { title: "Patient Dashboard", url: "/doctor/patients", icon: Users },
  { title: "Consultations", url: "/doctor/consultations", icon: ClipboardList },
  { title: "Diagnostic Tools", url: "/doctor/diagnostics", icon: Stethoscope },
  { title: "Analytics", url: "/doctor/analytics", icon: BarChart3 },
  { title: "Guidelines", url: "/doctor/guidelines", icon: BookOpen },
];

const emergencyItems = [
  { title: "Emergency Contacts", url: "/emergency", icon: Phone },
  { title: "Critical Symptoms", url: "/critical-symptoms", icon: AlertCircle },
];

const settingsItems = [
  { title: "AI Provider Settings", url: "/ai-settings", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [userRole] = useState<"patient" | "doctor">("patient"); // This would come from auth context

  const isActive = (path: string) => currentPath === path;
  const collapsed = state === "collapsed";

  const mainItems = userRole === "patient" ? patientItems : doctorItems;

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Header */}
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-medical flex items-center justify-center shadow-medical flex-shrink-0">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-foreground truncate">
                AI Medical Assistant
              </h2>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole} Portal
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            {userRole === "patient" ? "Patient Tools" : "Doctor Tools"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* Emergency Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Emergency
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {emergencyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-destructive/10 text-destructive"
                      activeClassName="bg-destructive/20 text-destructive font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-accent"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
