import React, { useState } from 'react';
import { Search, X, Check, AlertCircle, ArrowLeft, Trophy, Sparkles, RotateCcw } from 'lucide-react';
import socket from '../../services/socket.js';

export default function GriddyMode({ gameState, currentUser, isHost, onBackToLobby }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!gameState || !gameState.rows || !gameState.cols) {
    return (
      <div className="glass-panel p-8 rounded-3xl text-center">
        <p className="text-slate-400">Griddy tahtası yükleniyor...</p>
      </div>
    );
  }

  const { rows, cols, grid, currentTurnUsername, playerColors = {}, winner, winningLine, isDraw } = gameState;
  const isMyTurn = (currentTurnUsername || '').toLowerCase() === (currentUser?.username || '').toLowerCase();

  const handleCellClick = (cellIndex) => {
    if (winner || isDraw) return;
    if (grid[cellIndex]) return;
    if (currentTurnUsername && !isMyTurn) {
      alert(`Şu an sıra sizde değil! Hamle sırası: ${currentTurnUsername}`);
      return;
    }
    setSelectedCell(cellIndex);
    setSearchQuery('');
    setSearchResults([]);
    setSubmitError('');
  };

  const handlePassTurn = () => {
    socket.emit('pass-turn', {
      username: currentUser?.username,
      isHost
    });
  };

  const handleRestartGriddy = () => {
    socket.emit('host-start-mode', {
      mode: 'griddy',
      hostUsername: currentUser?.username
    });
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search-players?q=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlayer = (player) => {
    if (selectedCell === null) return;
    setSubmitError('');

    socket.emit(
      'griddy-submit',
      {
        cellIndex: selectedCell,
        playerId: player.id,
        username: currentUser?.username
      },
      (res) => {
        if (res.success) {
          setSelectedCell(null);
          setSearchQuery('');
          setSearchResults([]);
        } else {
          setSubmitError(res.message || 'Bu oyuncu bu hücrenin kriterlerine uymuyor!');
        }
      }
    );
  };

  const activeRowIdx = selectedCell !== null ? Math.floor(selectedCell / 3) : null;
  const activeColIdx = selectedCell !== null ? selectedCell % 3 : null;

  return (
    <div className="space-y-5">
      {/* Top Header & Turn Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={onBackToLobby}
          className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lobiye Dön</span>
        </button>

        {/* Turn Status & Restart Banner */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {winner ? (
            <div className="px-4 py-1.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-black flex items-center space-x-1.5 animate-bounce">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>{winner} 3'lüyü Yaptı! (+1 Puan)</span>
            </div>
          ) : isDraw ? (
            <div className="px-4 py-1.5 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold">
              Berabere!
            </div>
          ) : (
            currentTurnUsername && (
              <div className={`px-4 py-1.5 rounded-2xl border text-xs font-bold flex items-center space-x-2 shadow-lg transition-all ${
                isMyTurn
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/30 animate-pulse'
                  : 'bg-slate-900/90 text-amber-300 border-slate-700'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span>
                  {isMyTurn ? '🎯 Sıra Sende!' : `⏳ Hamle Sırası: ${currentTurnUsername}`}
                </span>
              </div>
            )
          )}

          {!winner && !isDraw && (isMyTurn || isHost) && (
            <button
              onClick={handlePassTurn}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all transform active:scale-95"
            >
              Pas Geç
            </button>
          )}

          {(winner || isDraw) && isHost && (
            <button
              onClick={handleRestartGriddy}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg transition-all flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yeni Tahta Aç</span>
            </button>
          )}
        </div>
      </div>

      {/* Players Color Legend */}
      <div className="flex items-center space-x-3 text-xs overflow-x-auto py-1">
        <span className="text-slate-400 font-bold uppercase text-[10px]">Oyuncu Renkleri:</span>
        {Object.entries(playerColors).map(([username, color]) => (
          <div key={username} className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-semibold text-slate-200">{username}</span>
          </div>
        ))}
      </div>

      {/* 3x3 Grid Layout */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl overflow-x-auto">
        <div className="min-w-[550px]">
          {/* Column Headers (Top) */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="h-16 flex items-center justify-center">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                3'LÜ KAZANIR
              </span>
            </div>
            {cols.map((col, cIdx) => (
              <div
                key={cIdx}
                className="h-16 rounded-2xl bg-slate-900/90 border border-slate-800 p-2 flex flex-col items-center justify-center text-center shadow-md"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {col.type === 'club' ? 'Kulüp' : 'Ülke'}
                </span>
                <span className="text-xs font-extrabold text-white truncate max-w-full">
                  {col.value}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-4 gap-2 mb-2">
              {/* Row Header (Left) */}
              <div className="h-28 rounded-2xl bg-slate-900/90 border border-slate-800 p-2 flex flex-col items-center justify-center text-center shadow-md">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {row.type === 'club' ? 'Kulüp' : 'Ülke'}
                </span>
                <span className="text-xs font-extrabold text-white line-clamp-2">
                  {row.value}
                </span>
              </div>

              {/* 3 Cells in Row */}
              {[0, 1, 2].map((cIdx) => {
                const cellIndex = rIdx * 3 + cIdx;
                const cellData = grid[cellIndex];
                const isSelected = selectedCell === cellIndex;
                const isWinningCell = winningLine && winningLine.includes(cellIndex);
                const cellColor = cellData?.color || '#10b981';

                return (
                  <div
                    key={cellIndex}
                    onClick={() => handleCellClick(cellIndex)}
                    style={
                      cellData
                        ? {
                            borderColor: cellColor,
                            boxShadow: isWinningCell ? `0 0 25px ${cellColor}` : `0 0 10px ${cellColor}30`
                          }
                        : {}
                    }
                    className={`h-28 rounded-2xl border transition-all flex flex-col items-center justify-center p-2 relative overflow-hidden group ${
                      cellData
                        ? 'bg-slate-900/90'
                        : isSelected
                        ? 'bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-400/40 cursor-pointer'
                        : 'bg-slate-900/50 hover:bg-slate-850/80 border-slate-800 hover:border-slate-700 cursor-pointer'
                    }`}
                  >
                    {cellData ? (
                      <>
                        <img
                          src={cellData.player.photo}
                          alt={cellData.player.name}
                          className="w-12 h-12 rounded-full object-cover shadow-md mb-1 bg-slate-800"
                          style={{ borderColor: cellColor, borderWidth: '2px' }}
                          onError={(e) => {
                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png';
                          }}
                        />
                        <span className="text-xs font-black text-white truncate max-w-full text-center">
                          {cellData.player.name}
                        </span>
                        <span
                          className="text-[10px] font-black truncate max-w-full mt-0.5 px-2 py-0.5 rounded-md"
                          style={{ color: cellColor, backgroundColor: `${cellColor}20` }}
                        >
                          {cellData.placedBy}
                        </span>
                      </>
                    ) : (
                      <div className="text-center text-slate-500 group-hover:text-emerald-400 transition-colors">
                        <span className="text-2xl font-bold">+</span>
                        <div className="text-[10px] font-semibold uppercase tracking-wider">
                          Doldur
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Player Search Modal Drawer */}
      {selectedCell !== null && activeRowIdx !== null && activeColIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-emerald-500/40 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-extrabold text-white text-base">Futbolcu Ara & Yerleştir</h4>
                <div className="flex items-center space-x-2 text-xs text-slate-300 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                    {rows[activeRowIdx].value}
                  </span>
                  <span className="text-slate-500 font-bold">&</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                    {cols[activeColIdx].value}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Futbolcu adı yazın (Örn: Osimhen, Haaland, Mbappé, Arda Güler)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-2.5 mb-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Autocomplete Results */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {searchResults.map((player) => (
                <div
                  key={player.id}
                  onClick={() => handleSelectPlayer(player)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover bg-slate-800 border border-slate-700"
                      onError={(e) => {
                        e.target.src = 'https://cdn-icons-png.flaticon.com/512/861/861512.png';
                      }}
                    />
                    <div>
                      <div className="text-xs font-extrabold text-white">
                        {player.fullName || player.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="text-slate-300 font-semibold">{player.club}</span>
                        <span>•</span>
                        <span>{player.nationality}</span>
                        <span>•</span>
                        <span className="text-slate-500">{player.primaryPosition}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-6 text-xs text-slate-500">
                  Eşleşen futbolcu bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
