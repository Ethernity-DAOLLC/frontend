import React from "react";

interface FormFieldProps {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  type?: "text" | "number" | "email" | "password" | "tel";
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = "number", // Cambiado a number por defecto para el caso de uso
  step = 1,
  min,
  max,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  icon,
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Validación mejorada
    if (type === "number") {
      const numValue = parseFloat(e.target.value);
      // Solo actualiza si es un número válido o string vacío (permite borrar)
      if (!isNaN(numValue)) {
        onChange(numValue);
      } else if (e.target.value === '') {
        onChange(0);
      }
    } else {
      // Para otros tipos, intenta convertir a número
      const converted = Number(e.target.value);
      onChange(isNaN(converted) ? 0 : converted);
    }
  };

  const inputClasses = `
    w-full px-4 py-3
    border-2 rounded-xl 
    transition-all duration-200
    focus:ring-4 focus:ring-purple-300 focus:border-purple-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${
      error
        ? "border-red-500 focus:ring-red-300"
        : "border-gray-300"
    }
    ${className}
  `;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {icon && <span className="text-gray-500">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={handleChange}
          step={type === "number" ? step : undefined}
          min={type === "number" ? min : undefined}
          max={type === "number" ? max : undefined}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClasses}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      ) : helperText ? (
        <p className="text-sm text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FormField;
