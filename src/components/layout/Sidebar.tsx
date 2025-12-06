import { NavLink } from '@/components/NavLink';
import { useApp } from '@/contexts/AppContext';
import {
  LayoutDashboard,
  FileBarChart,
  MessageSquare,
  Database,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileBarChart, label: 'Analytics', path: '/analytics' },
  { icon: Database, label: 'Data Explorer', path: '/data-explorer' },
  { icon: MessageSquare, label: 'AI Insights', path: '/ai-insights' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const { settings, toggleSidebar } = useApp();
  const collapsed = settings.sidebarCollapsed;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center border-b border-sidebar-border px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">InsightAI</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            'h-8 w-8 text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent',
            collapsed && 'absolute -right-3 top-6 bg-sidebar border border-sidebar-border rounded-full'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground transition-all duration-200',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
            activeClassName="bg-primary/10 text-primary border-l-2 border-primary"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground w-full transition-all duration-200',
            'hover:bg-destructive/10 hover:text-destructive',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Log out</span>}
        </button>
      </div>
    </aside>
  );
}
