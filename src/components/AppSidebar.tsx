import {
  LayoutDashboard, FileText, GitCompare, Wallet, MapPin,
  Search, Calculator, CheckCircle, BookOpen, MessageCircle,
  ShoppingBag, Leaf, LogOut, User, Settings, Shield, Vault,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/utils";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const navItems = [
  { title: "Dashboard",        url: "/dashboard", icon: LayoutDashboard },
  { title: "Claims Tracker",   url: "/claims",    icon: FileText },
  { title: "Document Vault",   url: "/vault",     icon: Vault },
  { title: "Compare Policies", url: "/compare",   icon: GitCompare },
  { title: "Family Wallet",    url: "/family",    icon: Wallet },
  { title: "Hyperlocal Search",url: "/search",    icon: MapPin },
  { title: "Gap Analysis",     url: "/gaps",      icon: Search },
  { title: "Cost Estimator",   url: "/cost",      icon: Calculator },
  { title: "Check Claim",      url: "/check",     icon: CheckCircle },
  { title: "Explain Policy",   url: "/explain",   icon: BookOpen },
  { title: "Chat Assistant",   url: "/chat",      icon: MessageCircle },
  { title: "Buy Insurance",    url: "/buy-insurance/profile",       icon: ShoppingBag },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [photoLoadError, setPhotoLoadError] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const displayName = profile?.fullName || user?.displayName || "User";
  const email       = profile?.email    || user?.email       || "";
  const initials    = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const photoURL    = profile?.photoURL || user?.photoURL    || "";
  const showPhoto   = photoURL && !photoLoadError; // Only show photo if URL exists AND hasn't failed to load

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarContent className="pt-3 pb-3 px-0 flex flex-col h-full gap-6 md:gap-8">
        {/* Logo */}
        <div className={`px-3 md:px-4 flex-shrink-0`}>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-10 h-10 rounded-lg green-gradient flex items-center justify-center flex-shrink-0 shadow-lg hover:shadow-xl transition-shadow">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex flex-col gap-0.5 min-w-0">
                <h2 className="font-display font-bold text-sm md:text-base text-sidebar-foreground leading-tight truncate">Health Insurance</h2>
                <p className="text-xs text-sidebar-foreground/70 leading-tight font-body">Saathi</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <SidebarGroup className="flex-1 overflow-y-auto px-2 md:px-3">
          <SidebarGroupContent className="py-2">
            <SidebarMenu className="gap-1 md:gap-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="h-auto">
                      <NavLink
                        to={item.url} end
                        className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-body transition-all duration-200 ${
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-foreground font-semibold shadow-sm" 
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {/* Admin Panel Link */}
            {profile && isAdmin(profile.role) && (
              <>
                <div className="my-3 md:my-4 h-px bg-sidebar-border/40 mx-2 md:mx-3" />
                <SidebarMenu className="gap-1 md:gap-1.5">
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith("/admin")} className="h-auto">
                      <NavLink
                        to="/admin"
                        className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-body transition-all duration-200 ${
                          location.pathname.startsWith("/admin")
                            ? "bg-amber-50/20 text-amber-400 font-semibold"
                            : "text-amber-600/70 hover:bg-amber-50/10 hover:text-amber-500"
                        }`}
                      >
                        <Shield className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate">Admin Panel</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User footer */}
        <div className={`px-2 md:px-3 pb-2 mt-auto border-t border-sidebar-border pt-4 md:pt-5 flex-shrink-0`}>
          {!collapsed ? (
            <div className="space-y-2 md:space-y-2.5">
              {/* User info → goes to profile */}
              <NavLink to="/profile"
                className="flex items-center gap-2 md:gap-3 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer group"
                activeClassName="bg-sidebar-accent">
                {showPhoto ? (
                  <img 
                    src={photoURL} 
                    alt={displayName} 
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all" 
                    onError={() => setPhotoLoadError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full green-gradient flex items-center justify-center flex-shrink-0 text-xs md:text-sm font-bold text-primary-foreground group-hover:shadow-lg transition-shadow">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-semibold text-sidebar-foreground truncate">{displayName}</p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">{email}</p>
                </div>
                <Settings className="h-3.5 w-3.5 md:h-4 md:w-4 text-sidebar-foreground/40 flex-shrink-0 group-hover:text-sidebar-foreground/70 transition-colors" />
              </NavLink>

              {/* Language Switcher */}
              <div className="mb-1">
                <LanguageSwitcher className="w-full text-xs md:text-sm" />
              </div>

              {/* Sign out */}
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-2 md:gap-3 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors font-body">
                <LogOut className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                <span className="truncate">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <NavLink to="/profile" title={displayName}
                className="w-full flex items-center justify-center p-2 md:p-2.5 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors group"
                activeClassName="bg-sidebar-accent text-sidebar-foreground">
                {showPhoto ? (
                  <img 
                    src={photoURL} 
                    alt={displayName} 
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all" 
                    onError={() => setPhotoLoadError(true)}
                  />
                ) : (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full green-gradient flex items-center justify-center text-xs font-bold text-primary-foreground group-hover:shadow-lg transition-shadow">
                    {initials}
                  </div>
                )}
              </NavLink>
              <div className="w-full flex items-center justify-center">
                <LanguageSwitcher compact={true} className="text-sidebar-foreground/60 hover:text-sidebar-foreground" />
              </div>
              <button onClick={handleSignOut} title="Sign Out"
                className="w-full flex items-center justify-center p-2 md:p-2.5 rounded-lg text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
