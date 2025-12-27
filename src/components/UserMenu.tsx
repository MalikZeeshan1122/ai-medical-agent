import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Settings, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      loadAvatar();
    }
  }, [user]);

  const loadAvatar = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) throw error;
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  const isDarkMode = mounted ? resolvedTheme === 'dark' : false;

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  if (!user) {
    return (
      <Button variant="outline" onClick={() => navigate('/auth')}>
        Login
      </Button>
    );
  }

  const userInitials = user.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0].toUpperCase() || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl || undefined} alt={user.user_metadata?.full_name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/medical-history')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Medical History</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleTheme}>
          {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
