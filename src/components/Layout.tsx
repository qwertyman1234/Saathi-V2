import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Shield } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 md:h-20 flex items-center justify-between border-b border-border bg-card px-4 md:px-6 sticky top-0 z-10 gap-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-shrink">
              <SidebarTrigger className="mr-1 md:mr-2 h-5 w-5 md:h-6 md:w-6" />
              <Shield className="h-5 w-5 md:h-6 md:w-6 text-accent flex-shrink-0" />
              <span className="font-display text-base md:text-lg font-bold text-foreground truncate">Health Insurance Saathi</span>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
          {/* Footer */}
          <footer className="green-gradient-dark text-primary-foreground py-6 md:py-8 px-4 md:px-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-2 md:gap-3">
                <Shield className="h-5 w-5 text-accent flex-shrink-0" />
                <span className="font-display text-base md:text-lg font-bold">Health Insurance Saathi</span>
              </div>
              <p className="text-xs md:text-sm opacity-70 text-center md:text-left">Empowering Indian families with smarter insurance decisions</p>
              <div className="flex gap-4 md:gap-6 text-xs md:text-sm opacity-70 flex-wrap justify-center md:justify-start">
                <span className="hover:opacity-100 cursor-pointer transition-opacity">Privacy</span>
                <span className="hover:opacity-100 cursor-pointer transition-opacity">Terms</span>
                <span className="hover:opacity-100 cursor-pointer transition-opacity">Support</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
