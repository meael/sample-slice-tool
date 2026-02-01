import { useState, useCallback } from 'react';
import type { ToastType } from '../components/Toast';

export interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export interface ToastActions {
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

const initialState: ToastState = {
  message: '',
  type: 'success',
  visible: false,
};

export function useToast(): ToastState & ToastActions {
  const [state, setState] = useState<ToastState>(initialState);

  const showToast = useCallback((message: string, type: ToastType) => {
    setState({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    showToast,
    hideToast,
  };
}
