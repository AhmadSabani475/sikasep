'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Store {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  store: Store | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  store: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function getInitialSession() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', user.id)
          .single();
        setStore(storeData);
      }

      setLoading(false);
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', currentUser.id)
            .single();
          setStore(storeData);
        } else {
          setStore(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, store, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
