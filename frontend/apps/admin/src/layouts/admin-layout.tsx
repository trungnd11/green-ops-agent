import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@xanh/utils";
import { fetchMyCompanies, type MyCompanyResponse } from "@/modules/company/api/company.api";
import { fetchMenuApi } from "@/modules/auth/api/auth.api";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  TrendingUp,
  Wallet,
  ArrowUpDown,
  MessageSquare,
  FileText,
  Bell,
  Shield,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  Clock,
  FolderTree,
  Gift,
} from "lucide-react";
import { authStore, router } from "@/app/router";

const iconMap: Record<string, typeof LayoutDashboard> = {
  "layout-dashboard": LayoutDashboard,
  "list-checks": ListChecks,
  users: Users,
  "trending-up": TrendingUp,
  wallet: Wallet,
  "arrow-up-down": ArrowUpDown,
  "message-square": MessageSquare,
  "file-text": FileText,
  bell: Bell,
  shield: Shield,
  "shield-check": Shield,
  settings: Settings,
  "building-2": Building2,
  history: Clock,
  "folder-tree": FolderTree,
  gift: Gift,
};

interface SidebarItem {
  icon?: typeof LayoutDashboard;
  label: string;
  to: string;
}

interface SidebarSection {
  label: string;
  items: SidebarItem[];
  collapsible?: boolean;
  headerIcon?: typeof LayoutDashboard;
  headerLabel?: string;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminGroupOpen, setAdminGroupOpen] = useState(true);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [companies, setCompanies] = useState<MyCompanyResponse[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const companyRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setCompanyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [companyError, setCompanyError] = useState<string | null>(null);

  const handleCompanyClick = async () => {
    if (companyDropdownOpen) {
      setCompanyDropdownOpen(false);
      return;
    }
    if (companies.length > 0) {
      setCompanyDropdownOpen(true);
      return;
    }
    setLoadingCompanies(true);
    setCompanyDropdownOpen(true);
    setCompanyError(null);
    try {
      const data = await fetchMyCompanies();
      setCompanies(data);
    } catch (err) {
      setCompanies([]);
      setCompanyError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleCompanySelect = (target: MyCompanyResponse) => {
    const current = authStore.getSession();
    if (!current) return;
    authStore.setSession({
      ...current,
      companyId: target.id,
      companyName: target.name,
      companyCode: target.code,
    });
    window.location.reload();
  };

  const queryClient = useQueryClient();
  const session = authStore.getSession();
  const companyName = session?.companyName ?? "Xanh SM";
  const companyInitials = companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const menuKey = session ? `${session.userId}_${session.companyId}` : "default";

  const { data: menuTree, isLoading: menuLoading, isFetching: menuFetching } = useQuery({
    queryKey: ["menu", menuKey],
    queryFn: fetchMenuApi,
    staleTime: 0,
  });

  const sidebarSections = useMemo(() => {
    if (!menuTree) return [];
    return menuTree.map((node) => {
      const Icon = iconMap[node.icon || ""];
      if (node.moduleType === "GROUP") {
        const isAdmin = node.code === "IAM";
        return {
          label: node.name.toUpperCase(),
          collapsible: isAdmin,
          headerIcon: Icon || Shield,
          headerLabel: node.name,
          items: (node.children || []).map((child) => ({
            icon: iconMap[child.icon || ""],
            label: child.name,
            to: child.route || "/",
          })),
        };
      }
      return {
        label: node.name.toUpperCase(),
        items: [
          { icon: Icon, label: node.name, to: node.route || "/" },
          ...(node.children || []).map((child) => ({
            icon: iconMap[child.icon || ""],
            label: child.name,
            to: child.route || "/",
          })),
        ],
      };
    });
  }, [menuTree]);

  const userInitials =
    session?.fullName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AD";

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    if (to === "/admin") {
      return location.pathname === "/admin" || location.pathname.startsWith("/admin/users");
    }
    return location.pathname === to || location.pathname.startsWith(to + "/");
  };

  const isAdminGroupActive = () => sidebarSections.some((s) => s.collapsible && s.items.some((item) => isActive(item.to)));

  return (
    <div className="bg-bg-canvas text-text-primary flex h-screen overflow-hidden" data-app="admin">
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={cn(
          "bg-bg-sidebar border-border-default fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-200 lg:static",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo + Slogan */}
        <div className={cn("flex flex-col", collapsed ? "items-center py-4" : "px-6 pb-4 pt-6")}>
          {collapsed ? (
            <span className="text-brand-cyan text-lg font-bold" style={{ fontFamily: "Manrope" }}>
              G
            </span>
          ) : (
            <div className="flex flex-col gap-1">
              <h1 className="text-brand-cyan text-xl font-bold leading-none" style={{ fontFamily: "Manrope" }}>
                GREENOPS
              </h1>
              <span className="text-text-tertiary text-[11px] font-semibold leading-none tracking-wide">QUẢN TRỊ</span>
            </div>
          )}
        </div>

        {/* Company Switcher */}
        {!collapsed && (
          <div ref={companyRef} className="relative mx-4">
            <button
              onClick={handleCompanyClick}
              className="rounded-badge bg-bg-subtle hover:bg-bg-elevated flex h-11 w-full items-center gap-2.5 px-3 transition-colors"
            >
              <div className="bg-brand-cyan flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px]">
                <span className="text-text-inverse text-[10px] font-semibold">{companyInitials}</span>
              </div>
              <span className="text-text-primary flex-1 truncate text-left text-[13px] font-medium">{companyName}</span>
              <ChevronDown
                className={cn(
                  "text-text-tertiary h-3.5 w-3.5 shrink-0 transition-transform",
                  companyDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {companyDropdownOpen && (
              <div className="rounded-btn bg-surface-card border-border-default absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden border shadow-lg">
                {loadingCompanies ? (
                  <div className="text-text-tertiary px-3 py-2.5 text-[13px]">Đang tải...</div>
                ) : companyError ? (
                  <div className="text-semantic-error px-3 py-2.5 text-[13px]">{companyError}</div>
                ) : companies.length === 0 ? (
                  <div className="text-text-tertiary px-3 py-2.5 text-[13px]">Không có dữ liệu công ty</div>
                ) : (
                  companies.map((c) => {
                    const active = c.id === session?.companyId;
                    const initials = c.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleCompanySelect(c)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                          active
                            ? "bg-brand-soft text-text-primary"
                            : "text-text-tertiary hover:bg-bg-subtle hover:text-text-secondary"
                        )}
                      >
                        <div className="bg-bg-elevated flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px]">
                          <span className="text-text-tertiary text-[10px] font-semibold">{initials}</span>
                        </div>
                        <span className="flex-1 truncate text-[13px] font-medium">{c.name}</span>
                        {c.defaultCompany && <span className="text-text-disabled text-[10px]">Mặc định</span>}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto px-4">
          {!menuTree && menuLoading ? (
            <div className="flex flex-col gap-3 px-4 pt-2">
              {!collapsed && <div className="h-3 w-16 rounded animate-pulse" style={{ background: "#3A4352" }} />}
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-[18px] w-[18px] rounded animate-pulse shrink-0" style={{ background: "#3A4352" }} />
                  {!collapsed && <div className="h-4 flex-1 rounded animate-pulse" style={{ background: "#3A4352" }} />}
                </div>
              ))}
              {!collapsed && <div className="h-3 w-20 rounded animate-pulse mt-2" style={{ background: "#3A4352" }} />}
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center gap-3 pl-6">
                  <div className="h-3 flex-1 rounded animate-pulse" style={{ background: "#3A4352" }} />
                </div>
              ))}
            </div>
          ) : sidebarSections.map((section) => {
            const HeaderIcon = section.headerIcon;
            return (
              <div key={section.label} className="flex flex-col">
                {/* Section Header */}
                {!collapsed && (
                  <div className="px-4 pb-0.5 pt-2">
                    <span className="text-text-disabled text-[11px] font-semibold tracking-wide">{section.label}</span>
                  </div>
                )}

                {section.collapsible && HeaderIcon ? (
                  <div className="flex flex-col">
                    {collapsed ? (
                      <button
                        onClick={() => setAdminGroupOpen(!adminGroupOpen)}
                        className={cn(
                          "rounded-badge mx-auto flex h-10 w-10 items-center justify-center transition-colors",
                          isAdminGroupActive()
                            ? "bg-brand-soft text-brand-teal"
                            : "text-text-tertiary hover:text-text-secondary hover:bg-bg-subtle"
                        )}
                      >
                        <HeaderIcon className="h-[18px] w-[18px]" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setAdminGroupOpen(!adminGroupOpen)}
                          className={cn(
                            "rounded-badge flex h-10 w-full items-center gap-3 px-4 transition-colors",
                            isAdminGroupActive()
                              ? "text-text-primary"
                              : "text-text-tertiary hover:text-text-secondary hover:bg-bg-subtle"
                          )}
                        >
                          <HeaderIcon className="h-[18px] w-[18px] shrink-0" />
                          <span className="flex-1 truncate text-left text-[13px] leading-normal">
                            {section.headerLabel}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-transform",
                              adminGroupOpen ? "rotate-0" : "-rotate-90"
                            )}
                          />
                        </button>

                        {adminGroupOpen && (
                          <div className="flex flex-col gap-0.5">
                            {section.items.map((item) => {
                              const active = isActive(item.to);
                              return (
                                <Link
                                  key={item.to}
                                  to={item.to as any}
                                  className={cn(
                                    "flex h-9 items-center rounded-lg pl-12 pr-4 transition-colors",
                                    active
                                      ? "bg-brand-soft text-text-primary"
                                      : "text-text-tertiary hover:text-text-secondary hover:bg-bg-subtle"
                                  )}
                                >
                                  <span className="flex-1 truncate text-[13px] leading-normal">{item.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  section.items.map((item) => {
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to as any}
                        className={cn(
                          "rounded-badge flex items-center transition-colors",
                          collapsed ? "mx-auto h-10 w-10 justify-center" : "h-10 gap-3 px-4",
                          active
                            ? "bg-brand-soft text-text-primary"
                            : "text-text-tertiary hover:text-text-secondary hover:bg-bg-subtle"
                        )}
                      >
                        {item.icon && (
                          <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-brand-teal")} />
                        )}
                        {!collapsed && <span className="flex-1 truncate text-[13px] leading-normal">{item.label}</span>}
                      </Link>
                    );
                  })
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "border-border-default flex items-center border-t",
            collapsed ? "justify-center p-3" : "gap-3 p-6"
          )}
        >
          {collapsed ? (
            <div className="bg-brand-teal flex h-9 w-9 items-center justify-center rounded-full">
              <span className="text-text-inverse text-xs font-semibold">{userInitials}</span>
            </div>
          ) : (
            <>
              <div className="bg-brand-teal flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                <span className="text-text-inverse text-xs font-semibold">{userInitials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-text-primary text-[13px] font-medium leading-tight">
                  {session?.fullName ?? "Admin"}
                </p>
                <p className="text-text-tertiary text-[11px] leading-tight">{session?.role ?? "Quản trị viên"}</p>
              </div>
              <button
                onClick={() => {
                  queryClient.clear();
                  authStore.logout();
                  router.options.context = {
                    ...router.options.context,
                    auth: { isAuthenticated: false, fullName: null, role: null, companyName: null },
                  } as any;
                  router.navigate({ to: "/login" });
                }}
              >
                <LogOut className="text-text-tertiary hover:text-text-secondary h-4 w-4 transition-colors" />
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="border-border-default text-text-tertiary hover:text-text-secondary hidden h-8 items-center justify-center border-t transition-colors lg:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-border-default bg-bg-topbar flex h-14 items-center justify-between border-b px-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden">
            <Menu className="text-text-secondary h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <Bell className="text-text-secondary hover:text-text-primary h-5 w-5 cursor-pointer transition-colors" />
            <div className="bg-surface-input text-text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
