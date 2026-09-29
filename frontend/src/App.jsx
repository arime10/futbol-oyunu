import React, { useState, useEffect } from 'react';
import socket from './services/socket.js';
import voiceManager from './services/webrtc.js';
import AuthScreen from './components/AuthScreen.jsx';
import Lobby from './components/Lobby.jsx';
import VoiceBar from './components/VoiceBar.jsx';
import Scoreboard from './components/Scoreboard.jsx';
import PodiumModal from './components/PodiumModal.jsx';

// Game Modes
import GriddyMode from './components/modes/GriddyMode.jsx';
import CareerMode from './components/modes/CareerMode.jsx';
import TransferDetectiveMode from './components/modes/TransferDetectiveMode.jsx';
import StatTargetMode from './components/modes/StatTargetMode.jsx';
import OneTeamOneCountryMode from './components/modes/OneTeamOneCountryMode.jsx';
import TwoTeamsOneCountryMode from './components/modes/TwoTeamsOneCountryMode.jsx';
import CardClashMode from './components/modes/CardClashMode.jsx';
import HigherLowerMode from './components/modes/HigherLowerMode.jsx';
import RebuildAuctionMode from './components/modes/RebuildAuctionMode.jsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('football_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [tableState, setTableState] = useState(null);
  const [inTable, setInTable] = useState(false);

  // Sync socket state
  useEffect(() => {
    socket.on('table-state', (state) => {
      setTableState(state);
      if (currentUser && state.exists) {
        const found = state.players?.some(p => p.username.toLowerCase() === currentUser.username.toLowerCase());
        if (found) {
          setInTable(true);
        }
      }
    });

    return () => {
      socket.off('table-state');
    };
  }, [currentUser]);

  // Connect WebRTC voice when joined table
  useEffect(() => {
    if (inTable && currentUser?.username) {
      voiceManager.init(currentUser.username);
    }
  }, [inTable, currentUser]);

  const handleCreateTable = (username, inviteCode, callback) => {
    socket.emit('create-table', { username, inviteCode }, (res) => {
      if (res.success) {
        const userObj = { username, isHost: true };
        setCurrentUser(userObj);
        localStorage.setItem('football_user', JSON.stringify(userObj));
        setInTable(true);
        setTableState(res.state);
      }
      callback(res);
    });
  };

  const handleJoinTable = (username, inviteCode, callback) => {
    socket.emit('join-table', { username, inviteCode }, (res) => {
      if (res.success) {
        const isHost = (username || '').toLowerCase() === (res.state.hostUsername || 'yued10').toLowerCase();
        const userObj = { username, isHost };
        setCurrentUser(userObj);
        localStorage.setItem('football_user', JSON.stringify(userObj));
        setInTable(true);
        setTableState(res.state);
      }
      callback(res);
    });
  };

  const handleStartMode = (mode) => {
    socket.emit('host-start-mode', {
      mode,
      hostUsername: currentUser?.username
    });
  };

  const handleBackToLobby = () => {
    socket.emit('host-start-mode', {
      mode: 'lobby',
      hostUsername: currentUser?.username
    });
  };

  const handleUpdateScore = (targetUsername, newScore) => {
    socket.emit('host-update-score', {
      targetUsername,
      newScore,
      hostUsername: currentUser?.username
    });
  };

  const handleAddPoints = (targetUsername, delta) => {
    socket.emit('host-add-points', {
      targetUsername,
      delta,
      hostUsername: currentUser?.username
    });
  };

  const handleEndGame = () => {
    socket.emit('host-end-game', {
      hostUsername: currentUser?.username
    });
  };

  const handleResetToLobby = () => {
    socket.emit('host-reset-game', {
      hostUsername: currentUser?.username
    });
  };

  // If not in table, show Auth / Join / Create Screen
  if (!inTable) {
    return (
      <AuthScreen
        onJoinTable={handleJoinTable}
        onCreateTable={handleCreateTable}
        tableState={tableState}
        hostUsername={tableState?.hostUsername || 'yuED10'}
      />
    );
  }

  const isHost = currentUser?.isHost || (currentUser?.username?.toLowerCase() === (tableState?.hostUsername || 'yued10').toLowerCase());

  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a] text-slate-100">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚽</span>
            <div>
              <div className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                Futbol Arena
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Masa Kodu: <span className="text-white font-bold">{tableState?.inviteCode}</span>
              </div>
            </div>
          </div>

          {/* Voice Bar inside Header */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <VoiceBar currentUser={currentUser} players={tableState?.players || []} />
          </div>

          {/* User profile pill */}
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
              {currentUser.username} {isHost && '👑 (Kurucu)'}
            </div>
          </div>
        </div>

        {/* Mobile Voice Bar */}
        <div className="md:hidden px-4 pb-2">
          <VoiceBar currentUser={currentUser} players={tableState?.players || []} />
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Game Arena / Lobby (Left 8 Cols) */}
        <div className="lg:col-span-8">
          {tableState?.gameMode === 'lobby' && (
            <Lobby
              tableState={tableState}
              isHost={isHost}
              onStartMode={handleStartMode}
              currentUser={currentUser}
            />
          )}

          {tableState?.gameMode === 'griddy' && (
            <GriddyMode
              gameState={tableState.gameState}
              currentUser={currentUser}
              isHost={isHost}
              onBackToLobby={handleBackToLobby}
            />
          )}

          {tableState?.gameMode === 'career' && (
            <CareerMode
              gameState={tableState.gameState}
              currentUser={currentUser}
              isHost={isHost}
              onBackToLobby={handleBackToLobby}
            />
          )}

          {tableState?.gameMode === 'detective' && (
            <TransferDetectiveMode
              gameState={tableState.gameState}
              currentUser={currentUser}
              isHost={isHost}
              onBackToLobby={handleBackToLobby}
            />
          )}

          {tableState?.gameMode === 'statTarget' && (
            <StatTargetMode
              gameState={tableState.gameState}
              currentUser={currentUser}
              isHost={isHost}
              onBackToLobby={handleBackToLobby}
            />
          )}

          {tableState?.gameMode === 'oneTeamOneCountry' && (
            <OneTeamOneCountryMode
              tableState={tableState}
              currentUser={currentUser}
              onBackToLobby={handleBackToLobby}
            />
          )}

          {tableState?.gameMode === 'twoTeamsOneCountry' && (
            <TwoTeamsOneCountryMode
              tableState={tableState}
              currentUser={currentUser}
              onBackToLobby={handleBackToLobby}
            />
          )}

          {tableState?.gameMode === 'cardClash' && (
            <CardClashMode
              tableState={tableState}
              currentUser={currentUser}
              onBackToLobby={handleBackToLobby}
            />
          )}

          {tableState?.gameMode === 'higherLower' && (
            <HigherLowerMode
              tableState={tableState}
              currentUser={currentUser}
              onBackToLobby={handleBackToLobby}
            />
          )}

          {tableState?.gameMode === 'rebuildAuction' && (
            <RebuildAuctionMode
              tableState={tableState}
              currentUser={currentUser}
              onBackToLobby={handleBackToLobby}
            />
          )}
        </div>

        {/* Live Scoreboard & Host Controls (Right 4 Cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-20">
            <Scoreboard
              players={tableState?.players || []}
              currentUser={currentUser}
              isHost={isHost}
              onUpdateScore={handleUpdateScore}
              onAddPoints={handleAddPoints}
              onEndGame={handleEndGame}
              onResetGame={handleResetToLobby}
            />
          </div>
        </div>
      </main>

      {/* Podium Celebration Modal on Game End */}
      {tableState?.isFinished && (
        <PodiumModal
          podium={tableState.podium}
          isHost={isHost}
          onResetToLobby={handleResetToLobby}
        />
      )}
    </div>
  );
}
