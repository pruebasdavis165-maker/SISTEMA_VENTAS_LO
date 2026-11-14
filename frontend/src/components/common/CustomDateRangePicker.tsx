import React, { useState, useRef, useEffect } from 'react';
import { CalendarRange, ChevronDown } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';

export interface DateRange {
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
  label?: string;
}

interface CustomDateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const formatDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const CustomDateRangePicker: React.FC<CustomDateRangePickerProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const setPreset = (preset: 'hoy' | 'ayer' | 'semana' | 'mes') => {
    const today = new Date();
    if (preset === 'hoy') {
      const hoyStr = formatDateStr(today);
      onChange({ desde: hoyStr, hasta: hoyStr, label: 'Hoy' });
    } else if (preset === 'ayer') {
      const ayer = new Date(today);
      ayer.setDate(today.getDate() - 1);
      const ayerStr = formatDateStr(ayer);
      onChange({ desde: ayerStr, hasta: ayerStr, label: 'Ayer' });
    } else if (preset === 'semana') {
      const sieteDias = new Date(today);
      sieteDias.setDate(today.getDate() - 6);
      onChange({ desde: formatDateStr(sieteDias), hasta: formatDateStr(today), label: 'Últimos 7 días' });
    } else if (preset === 'mes') {
      const primerDia = new Date(today.getFullYear(), today.getMonth(), 1);
      onChange({ desde: formatDateStr(primerDia), hasta: formatDateStr(today), label: 'Este Mes' });
    }
    setIsOpen(false);
  };

  const formatDisplay = () => {
    if (value.label) return value.label;
    if (value.desde === value.hasta) {
      const [y, m, d] = value.desde.split('-');
      return `${d}/${m}/${y}`;
    }
    const [y1, m1, d1] = value.desde.split('-');
    const [y2, m2, d2] = value.hasta.split('-');
    if (y1 === y2) {
      return `${d1}/${m1} - ${d2}/${m2}/${y2}`;
    }
    return `${d1}/${m1}/${y1} - ${d2}/${m2}/${y2}`;
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm transition-all cursor-pointer"
      >
        <CalendarRange className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="font-mono">{formatDisplay()}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto z-50 mt-1.5 w-80 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl p-4 text-xs animate-fade-in space-y-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Rango de Tiempo
          </span>

          {/* Presets Rápidos */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setPreset('hoy')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                value.label === 'Hoy'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setPreset('ayer')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                value.label === 'Ayer'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => setPreset('semana')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                value.label === 'Últimos 7 días'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              type="button"
              onClick={() => setPreset('mes')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold text-center border transition-all cursor-pointer ${
                value.label === 'Este Mes'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Este Mes
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Personalizado
            </span>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5 font-bold">DESDE:</span>
                <CustomDatePicker
                  value={value.desde}
                  onChange={(d) => onChange({ ...value, desde: d, label: undefined })}
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block mb-0.5 font-bold">HASTA:</span>
                <CustomDatePicker
                  value={value.hasta}
                  onChange={(d) => onChange({ ...value, hasta: d, label: undefined })}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Aplicar Filtro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
