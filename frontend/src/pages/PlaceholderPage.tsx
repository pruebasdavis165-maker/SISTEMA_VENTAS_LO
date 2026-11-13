import React from 'react';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
  milestone: string;
}

export const PlaceholderPage: React.FC<Props> = ({ title, milestone }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 rounded-2xl bg-slate-900 border border-slate-800">
      <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
        <Construction className="w-10 h-10 animate-bounce" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md">
        Este módulo está asignado a <span className="text-indigo-400 font-semibold">{milestone}</span>. La arquitectura frontend y rutas están listas para recibir la lógica de negocio.
      </p>
    </div>
  );
};
