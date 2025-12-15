"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarPlus, 
  CalendarCheck, 
  CalendarClock,
  Users, 
  UserPlus,
  UserCog,
  MessageSquare,
  Scissors,
  Settings,
  ChevronRight,
  Menu,
  X,
  User,
  Repeat
} from "lucide-react";
import { useState, useEffect } from "react";
import { Profile } from "@prisma/client";

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  submenu?: {
    title: string;
    href: string;
    icon?: React.ReactNode;
  }[];
}

interface BarberSidebarProps {
  profile: Profile;
}

export function BarberSidebar({ profile }: BarberSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const toggleMenu = (menuTitle: string) => {
    const newOpenMenus = new Set(openMenus);
    if (newOpenMenus.has(menuTitle)) {
      newOpenMenus.delete(menuTitle);
    } else {
      newOpenMenus.add(menuTitle);
    }
    setOpenMenus(newOpenMenus);
  };

  const menuItems: MenuItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      href: "/barber",
    },
    {
      title: "Randevular",
      icon: <Calendar size={20} />,
      submenu: [
        {
          title: "Randevu Ekle",
          href: "/barber/appointments/new",
          icon: <CalendarPlus size={16} />,
        },
        {
          title: "Aktif Randevular",
          href: "/barber/appointments/active",
          icon: <CalendarCheck size={16} />,
        },
        {
          title: "Geçmiş Randevular",
          href: "/barber/appointments/past",
          icon: <CalendarClock size={16} />,
        },
        {
          title: "Abone Randevuları",
          href: "/barber/appointments/subscriptions",
          icon: <Repeat size={16} />,
        },
      ],
    },
    {
      title: "Kullanıcılar",
      icon: <Users size={20} />,
      submenu: [
        {
          title: "Müşteriler",
          href: "/barber/customers",
          icon: <Users size={16} />,
        },
        {
          title: "Personeller",
          href: "/barber/staff",
          icon: <UserCog size={16} />,
        },
        {
          title: "Personel Rolleri",
          href: "/barber/staff/roles",
          icon: <UserCog size={16} />,
        },
        {
          title: "Yeni Rol Ekle",
          href: "/barber/staff/roles/new",
          icon: <UserPlus size={16} />,
        },
      ],
    },
    {
      title: "Mesajlar",
      icon: <MessageSquare size={20} />,
      href: "/barber/messages",
    },
    {
      title: "Hizmetler",
      icon: <Scissors size={20} />,
      href: "/barber/services",
    },
    {
      title: "Çalışma Saatleri",
      icon: <Calendar size={20} />,
      href: "/barber/availability",
    },
    {
      title: "Ayarlar",
      icon: <Settings size={20} />,
      href: "/barber/settings",
    },
    {
      title: "Müşteri Paneli",
      icon: <User size={20} />,
      href: "/customer",
    },
  ];

  // Tüm submenu href'lerini topla
  const allSubmenuHrefs = menuItems
    .flatMap(item => item.submenu?.map(sub => sub.href) || [])
    .filter((href): href is string => !!href);

  // En spesifik eşleşen submenu href'ini bul
  const getMostSpecificSubmenuMatch = () => {
    if (!pathname) return null;
    // En uzun eşleşmeyi bul (en spesifik olan)
    const matches = allSubmenuHrefs.filter(href => 
      pathname === href || pathname.startsWith(href + "/")
    );
    if (matches.length === 0) return null;
    // En uzun href'i döndür (en spesifik olan)
    return matches.reduce((a, b) => a.length > b.length ? a : b);
  };

  // Submenu itemları için aktif kontrolü (sadece en spesifik eşleşme aktif olur)
  const isSubmenuActive = (href: string) => {
    const mostSpecific = getMostSpecificSubmenuMatch();
    return mostSpecific === href;
  };

  // Ana menü itemları için aktif kontrolü (submenu itemları hariç)
  const isActive = (href: string) => {
    if (!href) return false;
    // Eğer bu href bir submenu item'ı ise, aktif olmamalı (submenu itemları için isSubmenuActive kullanılır)
    if (allSubmenuHrefs.includes(href)) {
      return false;
    }
    // Ana menü itemları için startsWith kontrolü yap
    // Ancak eğer pathname bir submenu item'ı ile eşleşiyorsa, ana menü aktif olmamalı
    const mostSpecificSubmenu = getMostSpecificSubmenuMatch();
    if (mostSpecificSubmenu) {
      return false; // Bir submenu item aktifse, ana menü aktif olmamalı
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  // Pathname değiştiğinde, aktif submenu item'ının parent menüsünü açık tut
  useEffect(() => {
    const activeSubmenuItem = menuItems.find(item => 
      item.submenu?.some(sub => pathname === sub.href)
    );
    
    if (activeSubmenuItem) {
      setOpenMenus(prev => new Set([...prev, activeSubmenuItem.title]));
    }
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-slate-200
          transform transition-transform duration-200 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b border-slate-200">
            <Link href="/barber" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <Scissors className="text-white" size={20} />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">{profile.shopName}</h1>
                <p className="text-xs text-slate-500">Yönetim Paneli</p>
              </div>
            </Link>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => (
              <div key={item.title}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-lg
                        text-sm font-medium transition-colors
                        ${openMenus.has(item.title)
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`transition-transform ${
                          openMenus.has(item.title) ? "rotate-90" : ""
                        }`}
                      />
                    </button>
                    {openMenus.has(item.title) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={`
                              flex items-center gap-3 px-4 py-2 rounded-lg text-sm
                              transition-colors
                              ${isSubmenuActive(subItem.href)
                                ? "bg-slate-900 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                              }
                            `}
                          >
                            {subItem.icon}
                            <span>{subItem.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href || "#"}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                      transition-colors
                      ${isActive(item.href || "")
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }
                    `}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

