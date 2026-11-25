import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  Activity,
  MapPin,
  Sliders,
  Users,
  AlertTriangle,
  FileWarning,
  ShieldAlert,
  FileBarChart,
  Bell,
  History,
  UserCheck,
  PlusCircle,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const adminNavItems = [
    { label: 'Overview Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Live Traffic Monitor', href: '/admin/monitoring', icon: Activity },
    { label: 'Intersections', href: '/admin/intersections', icon: MapPin },
    { label: 'Signal Configurations', href: '/admin/signal-configuration', icon: Sliders },
    { label: 'Traffic Police Accounts', href: '/admin/traffic-police', icon: Users },
    { label: 'Traffic Incidents', href: '/admin/incidents', icon: AlertTriangle },
    { label: 'Problem Reports', href: '/admin/problems', icon: FileWarning },
    { label: 'Emergency Priority', href: '/admin/emergency-history', icon: ShieldAlert },
    { label: 'Reports & Analytics', href: '/admin/reports', icon: FileBarChart },
    { label: 'System Audit Logs', href: '/admin/audit-logs', icon: History },
  ];

  const policeNavItems = [
    { label: 'Officer Dashboard', href: '/police/dashboard', icon: LayoutDashboard },
    { label: 'Live Monitor', href: '/police/monitoring', icon: Activity },
    { label: 'Assigned Crossings', href: '/police/intersections', icon: UserCheck },
    { label: 'Manage Emergency', href: '/police/emergency-priority', icon: ShieldAlert },
    { label: 'Record Incident', href: '/police/incidents/new', icon: PlusCircle },
    { label: 'My Incidents', href: '/police/incidents', icon: AlertTriangle },
    { label: 'Report Problem', href: '/police/problems/new', icon: PlusCircle },
    { label: 'My Problem Reports', href: '/police/problems', icon: FileWarning },
    { label: 'Emergency History', href: '/police/emergency-history', icon: History },
    { label: 'My Reports', href: '/police/reports', icon: FileBarChart },
  ];

  const navItems = isAdmin ? adminNavItems : policeNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-black text-lg">
              🚦
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide uppercase">
                Traffic System
              </h2>
              <span className="text-[10px] text-blue-400 font-semibold block tracking-wider uppercase">
                Wachemo University
              </span>
            </div>
          </div>
        </div>

        {/* Role Badge Indicator */}
        <div className="px-6 py-3.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Control Room Role
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              isAdmin ? 'bg-blue-900/60 text-blue-300 border border-blue-700/60' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
            }`}
          >
            {isAdmin ? 'ADMINISTRATOR' : 'TRAFFIC POLICE'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 bg-slate-950/40">
          <p className="font-semibold text-slate-400">SEng4162 Embedded Systems</p>
          <p className="text-[10px] text-slate-500 mt-0.5">ESP32 + MQTT + React + Express</p>
        </div>
      </aside>
    </>
  );
};
