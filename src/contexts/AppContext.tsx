import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuthContext } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Settings {
  sidebarCollapsed: boolean;
  notifications: boolean;
}

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  settings: Settings;
  setSettings: (settings: Settings) => void;
  toggleSidebar: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, loading: authLoading } = useAuthContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState<Settings>({
    sidebarCollapsed: false,
    notifications: true,
  });

  // Fetch user profile when auth user changes
  useEffect(() => {
    async function fetchProfile() {
      if (!authUser) {
        setUserProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (profile) {
          setUserProfile({
            id: authUser.id,
            name: profile.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            avatar: profile.avatar_url || undefined,
          });
        } else {
          setUserProfile({
            id: authUser.id,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            avatar: undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setUserProfile({
          id: authUser.id,
          name: authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          avatar: undefined,
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      fetchProfile();
    }
  }, [authUser, authLoading]);

  const toggleSidebar = () => {
    setSettings(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  };

  return (
    <AppContext.Provider 
      value={{ 
        user: userProfile, 
        setUser: setUserProfile, 
        settings, 
        setSettings, 
        toggleSidebar,
        isLoading: authLoading || isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
