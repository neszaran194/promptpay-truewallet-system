'use client';

import { useState, useCallback } from 'react';

interface ModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const showModal = useCallback((config: Omit<ModalState, 'isOpen'>) => {
    setModalState({
      ...config,
      isOpen: true
    });
  }, []);

  const hideModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, title?: string, onConfirm?: () => void) => {
    showModal({
      message,
      title,
      type: 'success',
      onConfirm
    });
  }, [showModal]);

  const showError = useCallback((message: string, title?: string, onConfirm?: () => void) => {
    showModal({
      message,
      title,
      type: 'error',
      onConfirm
    });
  }, [showModal]);

  const showWarning = useCallback((message: string, title?: string, onConfirm?: () => void) => {
    showModal({
      message,
      title,
      type: 'warning',
      onConfirm
    });
  }, [showModal]);

  const showInfo = useCallback((message: string, title?: string, onConfirm?: () => void) => {
    showModal({
      message,
      title,
      type: 'info',
      onConfirm
    });
  }, [showModal]);

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title?: string,
    confirmText?: string,
    cancelText?: string
  ) => {
    showModal({
      message,
      title,
      type: 'warning',
      onConfirm,
      onCancel,
      showCancel: true,
      confirmText,
      cancelText
    });
  }, [showModal]);

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  };
};