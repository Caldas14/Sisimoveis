import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

interface ToastState extends ToastProps {
  id: number;
  visible: boolean;
}

// Singleton para gerenciar toasts globalmente
class ToastManager {
  private static instance: ToastManager;
  private listeners: ((toasts: ToastState[]) => void)[] = [];
  private toasts: ToastState[] = [];
  private counter = 0;

  private constructor() {}

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public subscribe(listener: (toasts: ToastState[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.toasts);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public show(toast: ToastProps): number {
    const id = this.counter++;
    const newToast: ToastState = {
      ...toast,
      id,
      visible: true,
      duration: toast.duration || 5000, // Default 5 seconds
    };
    
    this.toasts = [...this.toasts, newToast];
    this.notifyListeners();

    // Auto-hide after duration
    if (newToast.duration !== 0) {
      setTimeout(() => {
        this.hide(id);
      }, newToast.duration);
    }
    
    return id;
  }

  public hide(id: number): void {
    this.toasts = this.toasts.map(toast => 
      toast.id === id ? { ...toast, visible: false } : toast
    );
    this.notifyListeners();
    
    // Remove from array after animation completes
    setTimeout(() => {
      this.toasts = this.toasts.filter(toast => toast.id !== id);
      this.notifyListeners();
      
      // Call onClose callback if provided
      const toast = this.toasts.find(t => t.id === id);
      if (toast?.onClose) toast.onClose();
    }, 300); // Animation duration
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }
}

export const toast = {
  show: (props: ToastProps) => ToastManager.getInstance().show(props),
  success: (message: string, duration?: number, onClose?: () => void) => 
    ToastManager.getInstance().show({
      message,
      type: 'success',
      duration,
      onClose
    }),
  error: (message: string, duration?: number, onClose?: () => void) => 
    ToastManager.getInstance().show({
      message,
      type: 'error',
      duration,
      onClose
    }),
  info: (message: string, duration?: number, onClose?: () => void) => 
    ToastManager.getInstance().show({
      message,
      type: 'info',
      duration,
      onClose
    }),
  warning: (message: string, duration?: number, onClose?: () => void) => 
    ToastManager.getInstance().show({
      message,
      type: 'warning',
      duration,
      onClose
    }),
};

// Componente individual de toast
const Toast = ({ message, type = 'info', onClose }: ToastProps & { onClose: () => void }) => {
  const { darkMode } = useTheme();
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return darkMode ? 'bg-green-900/30' : 'bg-green-50';
      case 'error':
        return darkMode ? 'bg-red-900/30' : 'bg-red-50';
      case 'warning':
        return darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50';
      case 'info':
      default:
        return darkMode ? 'bg-blue-900/30' : 'bg-blue-50';
    }
  };
  
  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return darkMode ? 'border-green-800' : 'border-green-200';
      case 'error':
        return darkMode ? 'border-red-800' : 'border-red-200';
      case 'warning':
        return darkMode ? 'border-yellow-800' : 'border-yellow-200';
      case 'info':
      default:
        return darkMode ? 'border-blue-800' : 'border-blue-200';
    }
  };
  
  const getTextColor = () => {
    switch (type) {
      case 'success':
        return darkMode ? 'text-green-300' : 'text-green-700';
      case 'error':
        return darkMode ? 'text-red-300' : 'text-red-700';
      case 'warning':
        return darkMode ? 'text-yellow-300' : 'text-yellow-700';
      case 'info':
      default:
        return darkMode ? 'text-blue-300' : 'text-blue-700';
    }
  };

  return (
    <div className={`flex items-start w-full max-w-sm rounded-lg shadow-md overflow-hidden ${getBgColor()} border ${getBorderColor()} animate-slide-in`}>
      <div className="flex-shrink-0 p-4">
        {getIcon()}
      </div>
      <div className="p-4 pt-3.5 flex-grow">
        <p className={`text-sm font-medium ${getTextColor()}`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-4 focus:outline-none"
        aria-label="Fechar"
      >
        <X className="h-5 w-5 text-gray-400 hover:text-gray-500" />
      </button>
    </div>
  );
};

// Container de toasts para renderizar todos os toasts ativos
export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  useEffect(() => {
    return ToastManager.getInstance().subscribe(setToasts);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      {toasts.map(({ id, visible, ...props }) => (
        <div
          key={id}
          className={`transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
        >
          <Toast {...props} onClose={() => ToastManager.getInstance().hide(id)} />
        </div>
      ))}
    </div>
  );
};

// Modal de confirmação estilizado
export interface ConfirmDialogProps {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isOpen: boolean;
}

export const ConfirmDialog = ({
  title,
  message,
  type = 'info',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isOpen,
}: ConfirmDialogProps) => {
  const { darkMode } = useTheme();
  
  if (!isOpen) return null;
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-10 w-10 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-10 w-10 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-10 w-10 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-10 w-10 text-blue-500" />;
    }
  };
  
  const getPrimaryButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className={`w-full max-w-md rounded-lg shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} animate-pop-in`}>
        <div className="p-6">
          <div className="flex items-center gap-4">
            {getIcon()}
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
          </div>
          <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {message}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-md text-white ${getPrimaryButtonColor()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de alerta simplificado (sem botão cancelar)
export interface AlertDialogProps {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  onConfirm: () => void;
  isOpen: boolean;
}

export const AlertDialog = ({
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  onConfirm,
  isOpen,
}: AlertDialogProps) => {
  return (
    <ConfirmDialog
      title={title}
      message={message}
      type={type}
      confirmText={confirmText}
      onConfirm={onConfirm}
      isOpen={isOpen}
    />
  );
};

export default {
  toast,
  Toast,
  ToastContainer,
  ConfirmDialog,
  AlertDialog
};
