import { useAppStore } from '../store/appStore';

export function useAppState() {
  return useAppStore();
}
