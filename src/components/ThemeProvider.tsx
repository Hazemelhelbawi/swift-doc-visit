import { useThemeSettings } from '@/hooks/useThemeSettings';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // This hook applies theme colors via CSS variables
  useThemeSettings();
  
  return <>{children}</>;
}
