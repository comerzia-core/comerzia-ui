import React from "react";

// Definimos la estructura de una opción (Label + Value)
export interface SelectOption {
    value: string | number;
    label: string;
}

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const ComerziaSelect = ({ label, options, error, placeholder = "Seleccione...", ...props }: Props) => {
  return (
    <div className="form-control w-full">
      <label className="label">
        <span className={`label-text font-semibold ${error ? "text-error" : ""}`}>{label}</span>
      </label>
      
      <select 
        className={`select select-bordered w-full ${error ? "select-error" : ""}`} 
        {...props}
      >
        <option disabled value="">{placeholder}</option>
        {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
                {opt.label}
            </option>
        ))}
      </select>

      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
};