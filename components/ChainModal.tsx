import React from 'react';
import { PRODUCTION_CHAINS_FULL as PRODUCTION_CHAINS, ChainLink, ProductionDefinition } from '../data/industryData';
import { getBuildingIcon, getIconSrc, getProductIcon } from '../utils/iconResolver';

interface ChainModalProps {
  chainId: string;
  onClose: () => void;
  baseUrl: string;
}

export const ChainModal: React.FC<ChainModalProps> = ({ chainId, onClose, baseUrl }) => {
  const chain = PRODUCTION_CHAINS[chainId] as ProductionDefinition | undefined;

  if (!chain) return null;

  interface ChainNodeProps {
    link: ChainLink;
    depth: number;
  }

  const ChainNode: React.FC<ChainNodeProps> = ({ link, depth }) => {
    const icon = getBuildingIcon(link.buildingId);
    const iconSrc = getIconSrc(icon, baseUrl);
    const hasInputs = link.inputs && link.inputs.length > 0;
    const hasAlternatives = link.alternatives && link.alternatives.length > 0;

    // Render a single building card
    const BuildingCard: React.FC<{ buildingId: string; count: number; iconSrc?: string }> = ({ buildingId, count, iconSrc }) => (
      <div className="flex flex-col items-center">
        {iconSrc && (
          <img
            src={iconSrc}
            alt={buildingId}
            className="w-12 h-12 object-contain drop-shadow-md mb-2"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div className="px-4 py-2 bg-slate-700/50 border border-white/20 rounded-lg backdrop-blur-sm">
          <div className="text-sm font-bold text-white text-center">{buildingId}</div>
          <div className="text-xs text-slate-300 font-mono text-center">×{count}</div>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col items-center">
        {/* Main building with alternatives side-by-side */}
        {hasAlternatives ? (
          <div className="flex items-center gap-3 mb-4">
            <BuildingCard buildingId={link.buildingId} count={link.count} iconSrc={iconSrc} />
            {link.alternatives!.map((altId, idx) => {
              const altIcon = getBuildingIcon(altId);
              const altIconSrc = getIconSrc(altIcon, baseUrl);
              return (
                <React.Fragment key={altId}>
                  <div className="text-amber-400 font-bold text-sm px-2">OR</div>
                  <BuildingCard buildingId={altId} count={link.count} iconSrc={altIconSrc} />
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <div className="mb-4">
            <BuildingCard buildingId={link.buildingId} count={link.count} iconSrc={iconSrc} />
          </div>
        )}

        {/* Input dependencies */}
        {hasInputs && (
          <div className="relative pt-2">
            {/* Vertical line from this node down */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-0 w-0.5 h-4 bg-gradient-to-b from-white/30 to-white/20" />

            {/* Horizontal line connecting inputs */}
            {link.inputs!.length > 1 && (
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 top-4 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ width: `${Math.max(200, (link.inputs!.length - 1) * 100)}px` }}
              />
            )}

            {/* Input nodes */}
            <div className={`flex ${link.inputs!.length > 1 ? 'gap-6 justify-center' : 'flex-col items-center'}`}>
              {link.inputs!.map((input, idx) => (
                <div key={`${link.buildingId}-input-${idx}`} className="relative">
                  {/* Vertical connector from horizontal line to input */}
                  {link.inputs!.length > 0 && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 -top-4 w-0.5 h-4 bg-gradient-to-b from-white/30 to-white/20" />
                  )}
                  <div className="pt-4">
                    <ChainNode link={input} depth={depth + 1} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
          <div className="flex items-center gap-4">
            {chain && (
              <>
                {(() => {
                  const icon = getProductIcon(chain.id);
                  const iconSrc = getIconSrc(icon, baseUrl);
                  return iconSrc ? (
                    <img
                      src={iconSrc}
                      alt={chain.name}
                      className="w-10 h-10 object-contain drop-shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null;
                })()}
                <div>
                  <h2 className="text-2xl font-bold text-white">{chain.name}</h2>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-2 flex-wrap">
                    {chain.regions.map((r, idx) => (
                      <React.Fragment key={r}>
                        {idx > 0 && <span>•</span>}
                        <span>{r}</span>
                      </React.Fragment>
                    ))}
                    <span>•</span>
                    <span>{chain.tier} Tier</span>
                  </p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chain content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-8">
            {/* Output info - Highlighted */}
            <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border-2 border-emerald-500/30 rounded-xl p-6">
              <p className="text-xs text-emerald-400 uppercase font-bold tracking-widest mb-2">📦 Final Output</p>
              <div className="flex items-center gap-3 mb-3">
                {(() => {
                  const icon = getProductIcon(chain!.id);
                  const iconSrc = getIconSrc(icon, baseUrl);
                  return iconSrc ? (
                    <img
                      src={iconSrc}
                      alt={chain!.name}
                      className="w-10 h-10 object-contain drop-shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null;
                })()}
                <div>
                  <p className="text-lg font-bold text-emerald-300">{chain.name}</p>
                  <p className="text-sm text-emerald-400/80">{chain.outputPerMinute} tons/min</p>
                </div>
              </div>
            </div>

            {/* Production chain tree */}
            {chain.chain && chain.chain.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-8">⚙️ Production Chain</p>
                <div className="bg-black/20 border border-white/5 rounded-xl p-8 flex flex-col items-center">
                  {/* Final output at top */}
                  <div className="flex flex-col items-center mb-8">
                    {(() => {
                      const icon = getProductIcon(chain!.id);
                      const iconSrc = getIconSrc(icon, baseUrl);
                      return (
                        <>
                          {iconSrc && (
                            <img
                              src={iconSrc}
                              alt={chain!.name}
                              className="w-16 h-16 object-contain drop-shadow-lg mb-3"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-lg backdrop-blur-sm">
                            <div className="text-sm font-bold text-emerald-300 text-center">{chain!.name}</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Vertical connector from output to buildings */}
                  <div className="w-0.5 h-6 bg-gradient-to-b from-white/30 to-white/20 mb-2" />

                  {/* Horizontal line connecting all input buildings */}
                  {chain.chain.length > 1 && (
                    <div 
                      className="h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent mb-2"
                      style={{ width: `${Math.max(300, (chain.chain.length - 1) * 140)}px` }}
                    />
                  )}

                  {/* Input buildings */}
                  <div className={`flex ${chain.chain.length > 1 ? 'gap-8 justify-center flex-wrap' : 'flex-col items-center'}`}>
                    {chain.chain.map((link, idx) => (
                      <div key={`root-${idx}`} className="relative">
                        {/* Vertical connector from horizontal line */}
                        {chain.chain.length > 0 && (
                          <div className="absolute left-1/2 transform -translate-x-1/2 -top-2 w-0.5 h-2 bg-gradient-to-b from-white/30 to-white/20" />
                        )}
                        <div className="pt-2">
                          <ChainNode link={link} depth={0} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No dependencies message */}
            {(!chain.chain || chain.chain.length === 0) && (
              <div className="bg-black/40 border-2 border-white/10 rounded-xl p-6 text-center">
                <svg className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-300 font-medium">Base Resource</p>
                <p className="text-slate-500 text-sm mt-1">No upstream production needed</p>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                <p className="text-xs text-blue-400 uppercase font-bold tracking-wider">Output Rate</p>
                <p className="text-lg font-bold text-blue-300 mt-2">{chain.outputPerMinute}</p>
                <p className="text-[10px] text-blue-400/70 mt-1">tons/min</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
                <p className="text-xs text-purple-400 uppercase font-bold tracking-wider">Tier</p>
                <p className="text-lg font-bold text-purple-300 mt-2">{chain.tier}</p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-center">
                <p className="text-xs text-rose-400 uppercase font-bold tracking-wider">Regions</p>
                <p className="text-lg font-bold text-rose-300 mt-2">{chain.regions.join(', ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 bg-slate-900/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-bold text-sm uppercase tracking-wider transition-all hover:shadow-lg"
          >
            Close Chain Details
          </button>
        </div>
      </div>
    </div>
  );
};

// Use centralized product icon resolver instead of static local map
