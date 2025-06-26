import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ChevronDown } from 'lucide-react';
import { OpcaoSelect } from '../services/valoresPersonalizadosService';

interface CustomizableSelectProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: OpcaoSelect[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onCustomValueDeleted?: (deletedValue: string) => void;
}

const CustomizableSelect: React.FC<CustomizableSelectProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Selecione uma opção',
  disabled = false,
  required = false,
  onCustomValueDeleted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hiddenSelectRef = useRef<HTMLSelectElement>(null);
  const [selectedOption, setSelectedOption] = useState<OpcaoSelect | undefined>(
    options.find(opt => opt.value === value)
  );
  
  // Update selected option when value or options change
  useEffect(() => {
    setSelectedOption(options.find(opt => opt.value === value));
    // Ensure dropdown recalculates when options change
    if (isOpen && options) {
      // This forces a re-render of the dropdown contents
      setIsOpen(false);
      setTimeout(() => setIsOpen(true), 10);
    }
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle select change
  const handleSelectOption = (option: OpcaoSelect) => {
    // Update the hidden select
    if (hiddenSelectRef.current) {
      hiddenSelectRef.current.value = option.value;
      const event = new Event('change', { bubbles: true });
      hiddenSelectRef.current.dispatchEvent(event);
    }
    
    setSelectedOption(option);
    setIsOpen(false);
  };

  // Handle delete of custom value
  const handleDeleteCustomValue = (option: OpcaoSelect, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      if (onCustomValueDeleted) {
        // Call the callback to handle deletion logic in the parent component
        onCustomValueDeleted(option.value);
      }
      
      // If deleting the currently selected value, reset to empty
      if (value === option.value && hiddenSelectRef.current) {
        hiddenSelectRef.current.value = '';
        const event = new Event('change', { bubbles: true });
        hiddenSelectRef.current.dispatchEvent(event);
        setSelectedOption(undefined);
      }
    } catch (error) {
      console.error('Erro ao excluir valor personalizado:', error);
    }
  };

  // Parse classes for different visual states
  const getBaseClasses = () => {
    const baseClasses = className || 'input';
    return `${baseClasses} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`;
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Hidden real select for form submission */}
      <select
        ref={hiddenSelectRef}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={{ display: 'none' }}
        aria-hidden="true"
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={`${option.value}-${index}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Custom select UI */}
      <div 
        className={`${getBaseClasses()} flex items-center justify-between pr-2`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape' && isOpen) {
            setIsOpen(false);
          }
        }}
      >
        <div className="flex-grow truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </div>
        
        <div className="flex items-center">
          {/* Trash icon for selected custom value */}
          {selectedOption?.personalizado && (
            <button
              type="button"
              className="mr-1 text-red-500 hover:text-red-700 p-1"
              onClick={(e) => {
                e.stopPropagation();
                if (selectedOption) {
                  handleDeleteCustomValue(selectedOption, e);
                }
              }}
              title="Excluir valor personalizado"
            >
              <Trash2 size={16} />
            </button>
          )}
          <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown options */}
      {isOpen && (
        <div 
          className="absolute left-0 top-full z-20 w-full mt-1 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {/* Placeholder option */}
          <div 
            className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => handleSelectOption({ value: '', label: placeholder })}
            role="option"
            aria-selected={value === ''}
          >
            {placeholder}
          </div>
          
          {/* Actual options */}
          {options.map((option, index) => (
            <div 
              key={`${option.value}-${index}`}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
              onClick={() => handleSelectOption(option)}
              role="option"
              aria-selected={value === option.value}
            >
              <span className="flex-grow">
                {option.label}
                {option.personalizado && <span className="ml-1 text-gray-500">(Personalizado)</span>}
              </span>
              
              {option.personalizado && (
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 p-1"
                  onClick={(e) => handleDeleteCustomValue(option, e)}
                  title="Excluir valor personalizado"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomizableSelect;
