
import React from 'react';
import { ShotDefinition, ShotType } from '../types';

interface ShotCardProps {
  shot: ShotDefinition;
  isSelected: boolean;
  onSelect: (id: ShotType) => void;
}

const ShotCard: React.FC<ShotCardProps> = ({ shot, isSelected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(shot.id)}
      className={`relative group p-4 border rounded-xl transition-all text-left flex flex-col gap-2 ${
        isSelected 
          ? 'border-black bg-black/5 ring-1 ring-black' 
          : 'border-gray-200 hover:border-gray-400 bg-white shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
          isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
        }`}>
          {shot.id}
        </span>
        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
          isSelected ? 'bg-black border-black' : 'bg-white border-gray-200 group-hover:border-gray-400'
        }`}>
          {isSelected && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <h3 className="font-serif text-base font-bold text-gray-900">{shot.label}</h3>
      <p className="text-[10px] text-gray-400 line-clamp-2 leading-tight uppercase font-semibold">{shot.description}</p>
    </button>
  );
};

export default ShotCard;
