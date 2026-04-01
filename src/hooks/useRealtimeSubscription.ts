import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribe to Realtime changes on a Supabase table.
 * Automatically invalidates the given React Query keys on any change.
 */
export function useRealtimeSubscription(
  tableName: string,
  queryKeys: string[][],
  enabled = true
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`${tableName}-realtime`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        () => {
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, enabled, queryClient, queryKeys]);
}
