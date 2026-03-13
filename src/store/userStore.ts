import { create } from 'zustand';

interface UserState {
  storeId: number | null;
  isAuthenticated: boolean;

  setStoreId: (id: number | null) => void;
  setAuthenticated: (value: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  storeId: null,
  isAuthenticated: false,

  setStoreId: (id) => set({ storeId: id }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
}));
