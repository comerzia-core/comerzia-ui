import React from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string; 
}

export const ComerziaInput = ({ label, error, className = "", ...props }: Props) => {
  return (
    <div className="form-control w-full">
      <label className="label">
        <span className={`label-text font-semibold ${error ? "text-error" : ""}`}>
            {label}
        </span>
      </label>
      
      <input
        className={`input input-bordered w-full ${error ? "input-error" : ""} ${className}`}
        {...props}
      />
      
      {/* Si hay error, mostramos el mensajito abajo */}
      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
};