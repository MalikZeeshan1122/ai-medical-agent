import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Stethoscope } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card shadow-soft sticky top-0 z-10">
            <div className="h-full px-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-accent" />
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  <h1 className="text-lg font-semibold text-foreground">
                    AI Medical Assistant
                  </h1>
                </div>
              </div>
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
