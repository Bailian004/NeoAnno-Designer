import React from 'react';
import { AnnoTitle } from '../types';
import { ANNO_TITLES_META } from '../constants';

interface HomePageProps {
  onSelectGame: (game: AnnoTitle) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectGame }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full my-8 md:my-0">
        <div className="text-center mb-10 md:mb-16">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-100 mb-4 tracking-tight">
            NeoAnno <span className="text-yellow-500">Designer</span>
          </h1>
          <p className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto px-2">
            The next-generation city layout planner for the Anno series. 
            Select your game title to begin designing your empire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {(Object.keys(ANNO_TITLES_META) as AnnoTitle[]).map((title) => {
            const meta = ANNO_TITLES_META[title];
            return (
              <button
                key={title}
                onClick={() => onSelectGame(title)}
                className={`group relative overflow-hidden rounded-xl border-2 border-transparent transition-all duration-300 hover:scale-105 hover:${meta.theme} bg-gray-800 text-left`}
              >
                <div className="aspect-[3/2] w-full overflow-hidden">
                  <img 
                    src={meta.image} 
                    alt={title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-90" />
                </div>
                
                <div className="absolute bottom-0 left-0 p-4 md:p-6 w-full">
                  <p className="text-yellow-500 text-xs md:text-sm font-mono mb-1">{meta.year}</p>
                  <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                    {title}
                  </h3>
                  <div className="h-1 w-12 bg-gray-600 mt-3 group-hover:bg-yellow-500 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};