import { create } from 'zustand';

export interface Address {
  address: string;
  isStartPoint?: boolean;
  lat?: number;
  lon?: number;
}

interface RouteStore {
  addresses: Address[];
  optimizedRoute: Address[] | null;
  addAddress: (address: string) => void;
  removeAddress: (index: number) => void;
  clearAddresses: () => void;
  setStartPoint: (address: string) => void;
  setOptimizedRoute: (route: Address[]) => void;
}

export const useRouteStore = create<RouteStore>((set, get) => ({
  addresses: [],
  optimizedRoute: null,
  
  addAddress: (address: string) => {
    set((state) => ({
      addresses: [...state.addresses, { address }],
      optimizedRoute: null, // Reset optimized route when addresses change
    }));
  },
  
  removeAddress: (index: number) => {
    set((state) => ({
      addresses: state.addresses.filter((_, i) => i !== index),
      optimizedRoute: null,
    }));
  },
  
  clearAddresses: () => {
    set({
      addresses: [],
      optimizedRoute: null,
    });
  },
  
  setStartPoint: (address: string) => {
    set((state) => ({
      addresses: state.addresses.map((addr) => ({
        ...addr,
        isStartPoint: addr.address === address,
      })),
      optimizedRoute: null,
    }));
  },
  
  setOptimizedRoute: (route: Address[]) => {
    set({ optimizedRoute: route });
  },
}));