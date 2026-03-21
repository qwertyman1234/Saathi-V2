import {
  BarChart3, Package, Users, FileText, LogOut, Settings, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const adminNavItems = [
  { title: "Analytics",       url: "/admin/analytics", icon: BarChart3 },
  { title: "Insurance Plans", url: "/admin/plans",     icon: Package },
  { title: "Users",           url: "/admin/users",     icon: Users },
  { title: "Claims Review",   url: "/admin/claims",    icon: FileText },
  { title: "Account",         url: "/admin/account",   icon: Settings },
  // Phase 6 features (deferred):
  // { title: "Audit Logs",      url: "/admin/audit",     icon: History },
  // { title: "Site Content",    url: "/admin/content",   icon: Edit },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const displayName = profile?.fullName || user?.displayName || "Admin";
  const email       = profile?.email    || user?.email       || "";
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const photoURL    = profile?.photoURL || user?.photoURL    || "";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4 flex flex-col h-full">
        {/* Logo with Admin Badge */}
        <div className={`px-4 pb-5 ${collapsed ? "px-2" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-display font-bold text-base text-sidebar-foreground leading-tight">Admin Panel</h2>
                <p className="text-xs text-sidebar-foreground/60 leading-tight font-body">Saathi Health</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <SidebarGroup className="flex-1 overflow-y-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-foreground font-semibold"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="font-body">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Back to User Dashboard & User footer */}
        <div className={`px-3 pb-4 mt-auto border-t border-sidebar-border pt-3 space-y-2 ${collapsed ? "px-2" : ""}`}>
          {!collapsed ? (
            <NavLink
              to="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <span className="text-xs">← Back to Dashboard</span>
            </NavLink>
          ) : null}

          <div className={collapsed ? "space-y-1" : ""}>
            {!collapsed ? (
              <div className="space-y-1">
                {/* User info */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/20">
                  {photoURL ? (
                    <img src={photoURL} alt={displayName} className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
                    <p className="text-xs text-sidebar-foreground/50 truncate">{email}</p>
                  </div>
                </div>

                {/* Sign out */}
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <button onClick={handleSignOut} title="Sign Out"
                  className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
