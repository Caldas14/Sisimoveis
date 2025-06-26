import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';

interface CustomValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => void;
  title: string;
  darkMode: boolean;
}

const CustomValueModal: React.FC<CustomValueModalProps> = ({ isOpen, onClose, onSave, title, darkMode }) => {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setValue('');
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave(value.trim());
      setSuccess(true);
      setTimeout(() => {
        setValue('');
        setSuccess(false);
        setIsSubmitting(false); // Reset submitting state on success
        onClose();
      }, 800);
    } catch (error) {
      console.error('Erro ao salvar valor personalizado:', error);
      setIsSubmitting(false);
    }
  };

  const modalBgClass = darkMode 
    ? 'bg-gradient-to-br from-gray-800 to-gray-900' 
    : 'bg-gradient-to-br from-white to-gray-50';

  const inputBgClass = darkMode
    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500'
    : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500';

  const primaryBtnClass = darkMode
    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white';

  const secondaryBtnClass = darkMode
    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300';

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className={`w-full max-w-md rounded-xl shadow-2xl ${modalBgClass} p-6 transform transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{ backdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Plus className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-1.5 transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="customValue" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Novo valor personalizado
            </label>
            <div className="relative">
              <input
                type="text"
                id="customValue"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={`w-full rounded-lg border px-4 py-3 shadow-sm transition-all duration-200 ${inputBgClass}`}
                placeholder="Digite o novo valor"
                autoFocus
              />
              {success && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 animate-pulse">
                  <Check className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${secondaryBtnClass}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !value.trim()}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${primaryBtnClass} ${(isSubmitting || !value.trim()) ? 'opacity-70 cursor-not-allowed' : 'shadow-md hover:shadow-lg'}`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>Salvando...</span>
                </div>
              ) : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomValueModal;
