
import React from 'react';
import { Temple } from '../types';

interface TempleInfoProps {
  temple: Temple;
  loading: boolean;
}

const TempleInfo: React.FC<TempleInfoProps> = ({ temple, loading }) => {
  return (
    <div className="bg-neutral-900/80 backdrop-blur-lg border border-neutral-700 rounded-xl p-6 h-full overflow-y-auto custom-scrollbar shadow-2xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-amber-500 mb-2">{temple.name}</h2>
        <p className="text-gray-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {temple.address}
        </p>
      </div>

      <div className="border-t border-neutral-700 pt-6">
        <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 4.804A7.993 7.993 0 002 12a7.998 7.998 0 003 6.318V19a1 1 0 001 1h8a1 1 0 001-1v-.682A7.998 7.998 0 0018 12a7.993 7.993 0 00-7-7.196V4a1 1 0 00-1-1h-1a1 1 0 00-1 1v.804z" />
          </svg>
          お寺の由緒・歴史
        </h3>
        
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-neutral-800 rounded w-full"></div>
            <div className="h-4 bg-neutral-800 rounded w-5/6"></div>
            <div className="h-4 bg-neutral-800 rounded w-4/6"></div>
            <div className="h-4 bg-neutral-800 rounded w-full"></div>
          </div>
        ) : (
          <div className="prose prose-invert prose-amber max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
            {temple.description || "詳細情報を取得中です..."}
          </div>
        )}

        {temple.sources && temple.sources.length > 0 && (
          <div className="mt-8 pt-6 border-t border-neutral-800">
            <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">出典・参考文献</h4>
            <ul className="space-y-2">
              {temple.sources.map((source: any, idx) => {
                const web = source.web;
                if (!web) return null;
                return (
                  <li key={idx} className="text-xs">
                    <a 
                      href={web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-500 underline transition-colors"
                    >
                      {web.title || web.uri}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TempleInfo;
