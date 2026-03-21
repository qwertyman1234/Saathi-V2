import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Shield } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b border-border bg-card px-6 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-2" />
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-display text-lg font-semibold text-foreground">Admin Panel</span>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
          {/* Footer */}
          <footer className="green-gradient-dark text-primary-foreground py-8 px-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <span className="font-display font-bold">Saathi Health Admin</span>
              </div>
              <p className="text-sm opacity-70">Administrative Dashboard for Health Insurance Management</p>
              <div className="flex gap-6 text-sm opacity-70">
                <span className="cursor-pointer transition-opacity">Privacy</span>
                <span className="cursor-pointer transition-opacity">Support</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
