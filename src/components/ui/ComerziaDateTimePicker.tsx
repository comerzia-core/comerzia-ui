import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale/es";
import { Calendar, X } from "lucide-react";
import { Controller, type Control } from "react-hook-form";
import type { ReactNode } from "react";

// Registramos español
registerLocale("es", es);

interface Props {
    label: string;
    name: string;
    control: Control<any>;
    placeholder?: string;
    helperText?: ReactNode;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
    isBirthDate?: boolean; // Activa modo "Cumpleaños"
}

export const TravesiaDateTimePicker = ({
    label,
    name,
    control,
    placeholder = "Seleccione una fecha...",
    helperText,
    disabled,
    minDate,
    maxDate,
    isBirthDate = false,
}: Props) => {
return (
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <div className="form-control w-full">
                    
                    {/* ✅ 1. LABEL ADENTRO: Ahora se pinta de rojo si hay error */}
                    <label className="label">
                        <span className={`label-text font-bold ${error ? "text-error" : "text-base-content/70"}`}>
                            {label}
                        </span>
                    </label>

                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 z-10 pointer-events-none">
                            <Calendar size={18} />
                        </div>

                        <DatePicker
                            selected={value ? new Date(value) : null}
                            onChange={(date: Date | null) => {
                                if (date) {
                                    const dateToSave = new Date(date);
                                    if (!isBirthDate) {
                                        dateToSave.setHours(23, 59, 59, 999);
                                    }
                                    onChange(dateToSave.toISOString());
                                } else {
                                    onChange(null);
                                }
                            }}
                            showTimeSelect={false}
                            dateFormat="dd 'de' MMMM, yyyy"
                            locale="es"
                            placeholderText={placeholder}
                            disabled={disabled}
                            minDate={minDate} 
                            maxDate={maxDate}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select" 
                            yearDropdownItemNumber={100} 
                            scrollableYearDropdown={false} 
                            portalId="root"
                            popperProps={{ strategy: "fixed" }}
                            popperClassName="!z-[99999]" 
                            // ✅ 2. Borde rojo forzado si hay error
                            className={`
                                input input-bordered w-full pl-10 pr-10 text-sm font-medium
                                focus:outline-none focus:border-primary transition-all
                                ${error ? "input-error border-error" : ""} 
                                ${disabled ? "bg-base-200 cursor-not-allowed" : "bg-base-100"}
                            `}
                            wrapperClassName="w-full"
                            calendarClassName="shadow-3xl border-0 font-sans rounded-xl overflow-hidden !bg-base-100 !text-base-content !border-base-300"
                            dayClassName={() => "hover:!bg-primary hover:!text-primary-content rounded-full"}
                        />

                        {value && !disabled && (
                            <button
                                type="button"
                                onClick={() => onChange(null)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-error transition-colors p-1"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* ✅ 3. MENSAJE ERROR: Prioridad al error sobre el helperText */}
                    {(error || helperText) && (
                        <label className="label pb-0">
                            <span className={`label-text-alt ${error ? "text-error font-bold" : "text-base-content/60"}`}>
                                {error ? error.message : helperText}
                            </span>
                        </label>
                    )}
                </div>
            )}
        />
    );
};