import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Seleccionar fecha'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parsear fecha seleccionada
  const parseDate = (dStr: string) => {
    if (!dStr) return new Date();
    const [y, m, d] = dStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const selectedDate = parseDate(value);
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate));

  useEffect(() => {
    setViewDate(parseDate(value));
  }, [value]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Días del mes
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    onChange(`${year}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const mStr = String(today.getMonth() + 1).padStart(2, '0');
    const dStr = String(today.getDate()).padStart(2, '0');
    onChange(`${y}-${mStr}-${dStr}`);
    setViewDate(today);
    setIsOpen(false);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const formatDisplay = (dStr: string) => {
    if (!dStr) return placeholder;
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="relative inline-block text-left w-full" ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Botón Trigger con diseño estilizado */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{formatDisplay(value)}</span>
        </div>
        <span className="text-[10px] text-slate-400">▼</span>
      </button>

      {/* Popover del Calendario */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl p-4 text-xs animate-fade-in select-none">
          {/* Header del Calendario: Mes y Año + Flechas */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {MONTH_NAMES[month]} {year}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Días de la Semana */}
          <div className="grid grid-cols-7 gap-1 mt-2 text-center text-[10px] font-bold text-slate-400 uppercase">
            {DAY_NAMES.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>

          {/* Días Grid */}
          <div className="grid grid-cols-7 gap-1 mt-2">
            {/* Días del mes anterior */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div
                key={`prev-${idx}`}
                className="h-8 flex items-center justify-center text-slate-300 dark:text-slate-700 text-xs font-mono"
              >
                {prevMonthTotalDays - firstDayIndex + idx + 1}
              </div>
            ))}

            {/* Días del mes actual */}
            {Array.from({ length: totalDays }).map((_, idx) => {
              const day = idx + 1;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={`curr-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${
                    selected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : today
                      ? 'border border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer de Acciones Rápidas */}
          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
            >
              Seleccionar Hoy
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
