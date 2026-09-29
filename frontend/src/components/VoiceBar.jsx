import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, Users, Radio, AlertCircle } from 'lucide-react';
import voiceManager from '../services/webrtc.js';

export default function VoiceBar({ currentUser, players = [] }) {
  const [voiceState, setVoiceState] = useState({
    isMuted: false,
    isSpeaking: false,
    initialized: false,
    hasPermission: false
  });

  useEffect(() => {
    const unsubscribe = voiceManager.subscribe((state) => {
      setVoiceState(state);
    });
    return unsubscribe;
  }, []);

  const handleToggleMute = () => {
    voiceManager.toggleMute();
  };

  const handleRetryPermission = () => {
    if (currentUser?.username) {
      voiceManager.init(currentUser.username);
    }
  };

  return (
    <div className="glass-panel px-4 py-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 shadow-xl">
      {/* Left: User Mic Control Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleToggleMute}
          disabled={!voiceState.hasPermission}
          title={voiceState.isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95 ${
            !voiceState.hasPermission
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : voiceState.isMuted
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 ring-2 ring-emerald-500/20'
          }`}
        >
          {voiceState.isMuted ? (
            <>
              <MicOff className="w-4 h-4 text-rose-400" />
              <span>Mikrofon Kapalı</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Mikrofon Açık</span>
            </>
          )}
        </button>

        {!voiceState.hasPermission && (
          <button
            onClick={handleRetryPermission}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-all"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Mikrofon İzni Ver</span>
          </button>
        )}
      </div>

      {/* Center: Live Speaker Avatars */}
      <div className="flex items-center space-x-2 overflow-x-auto py-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline-block mr-1">
          Ses Odası:
        </span>
        {players.map((p) => {
          const isMe = p.username === currentUser?.username;
          const speaking = isMe ? voiceState.isSpeaking : p.isSpeaking;
          const muted = isMe ? voiceState.isMuted : p.isMuted;

          return (
            <div
              key={p.socketId || p.username}
              className={`relative flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs transition-all ${
                speaking
                  ? 'bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-400 border border-emerald-500/50 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/60 text-slate-300 border border-slate-800'
              }`}
            >
              {/* Speaking pulse indicator */}
              {speaking && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}

              <span className="font-medium truncate max-w-[80px]">
                {p.username} {isMe && '(Sen)'}
              </span>

              {muted ? (
                <MicOff className="w-3 h-3 text-rose-400 flex-shrink-0" />
              ) : speaking ? (
                <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse flex-shrink-0" />
              ) : (
                <Mic className="w-3 h-3 text-slate-500 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Audio Network status indicator */}
      <div className="flex items-center space-x-2 text-xs text-slate-400 flex-shrink-0">
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800">
          <Radio className={`w-3.5 h-3.5 ${voiceState.hasPermission ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-mono text-[11px] hidden md:inline">WebRTC Mesh</span>
        </div>
      </div>
    </div>
  );
}
