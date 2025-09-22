'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon, CheckCircledIcon, CrossCircledIcon, ExclamationTriangleIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { Button } from './ui/Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
  onConfirm,
  onCancel,
  showCancel = false
}) => {
  const getIcon = () => {
    const iconClasses = "w-8 h-8 flex-shrink-0";
    switch (type) {
      case 'success':
        return (
          <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg animate-pulse">
            <CheckCircledIcon className={`${iconClasses} text-white`} />
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-lg">
            <CrossCircledIcon className={`${iconClasses} text-white`} />
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg">
            <ExclamationTriangleIcon className={`${iconClasses} text-white`} />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-lg">
            <InfoCircledIcon className={`${iconClasses} text-white`} />
          </div>
        );
    }
  };

  const getBackgroundStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-br from-green-50 via-white to-green-50 border-green-200';
      case 'error':
        return 'bg-gradient-to-br from-red-50 via-white to-red-50 border-red-200';
      case 'warning':
        return 'bg-gradient-to-br from-yellow-50 via-white to-orange-50 border-orange-200';
      case 'info':
      default:
        return 'bg-gradient-to-br from-blue-50 via-white to-blue-50 border-blue-200';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'success':
        return '🎉 สำเร็จแล้ว!';
      case 'error':
        return '❌ เกิดข้อผิดพลาด';
      case 'warning':
        return '⚠️ คำเตือน';
      case 'info':
      default:
        return '💡 แจ้งเตือน';
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-all duration-300" />
        <Dialog.Content className={`fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] ${getBackgroundStyle()} border-2 rounded-2xl shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] mx-4 overflow-hidden`}>

          {/* Decorative gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>

          {/* Header */}
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-start space-x-4">
                {getIcon()}
                <div className="flex-1">
                  <Dialog.Title className="text-xl font-bold text-gray-900 leading-tight mb-2">
                    {title || getDefaultTitle()}
                  </Dialog.Title>
                  <Dialog.Description className="text-gray-700 leading-relaxed text-base">
                    {message}
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all duration-200 rounded-full p-2 hover:bg-white/80 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  aria-label="Close"
                >
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-white/50 backdrop-blur-sm border-t border-gray-200/50 flex justify-end space-x-3">
            {showCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="px-6 py-2 font-medium transition-all duration-200 hover:scale-105"
              >
                {cancelText}
              </Button>
            )}
            <Button
              variant={type === 'error' ? 'destructive' : type === 'success' ? 'success' : 'default'}
              onClick={handleConfirm}
              className="px-6 py-2 font-medium transition-all duration-200 hover:scale-105 shadow-lg"
            >
              {confirmText}
            </Button>
          </div>

          {/* Sparkle effect for success */}
          {type === 'success' && (
            <>
              <div className="absolute top-6 right-16 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute top-12 right-24 w-1 h-1 bg-yellow-300 rounded-full animate-pulse delay-200"></div>
              <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce delay-300"></div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;