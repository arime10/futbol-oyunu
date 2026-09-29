export function setupVoiceHandlers(io, socket, roomManager) {
  // Client requests to join voice mesh
  socket.on('voice-join', ({ username }) => {
    try {
      const tableState = roomManager.getTableState();
      if (!tableState.exists) return;

      // Notify all other clients at the table to initiate WebRTC peer connection
      socket.broadcast.emit('voice-peer-joined', {
        socketId: socket.id,
        username
      });
    } catch (err) {
      console.error('voice-join error:', err.message);
    }
  });

  // Relay WebRTC Offer
  socket.on('voice-offer', ({ toSocketId, offer }) => {
    if (!toSocketId || !offer) return;
    io.to(toSocketId).emit('voice-offer', {
      fromSocketId: socket.id,
      offer
    });
  });

  // Relay WebRTC Answer
  socket.on('voice-answer', ({ toSocketId, answer }) => {
    if (!toSocketId || !answer) return;
    io.to(toSocketId).emit('voice-answer', {
      fromSocketId: socket.id,
      answer
    });
  });

  // Relay ICE Candidate
  socket.on('voice-ice-candidate', ({ toSocketId, candidate }) => {
    if (!toSocketId || !candidate) return;
    io.to(toSocketId).emit('voice-ice-candidate', {
      fromSocketId: socket.id,
      candidate
    });
  });

  // Mute / Unmute state change
  socket.on('voice-mute-toggle', ({ isMuted }) => {
    const updated = roomManager.updateVoiceStatus(socket.id, { isMuted });
    if (updated) {
      io.emit('voice-status-updated', {
        socketId: socket.id,
        username: updated.username,
        isMuted: updated.isMuted
      });
    }
  });

  // Speaking activity change (VAD)
  socket.on('voice-speaking-toggle', ({ isSpeaking }) => {
    const updated = roomManager.updateVoiceStatus(socket.id, { isSpeaking });
    if (updated) {
      io.emit('voice-status-updated', {
        socketId: socket.id,
        username: updated.username,
        isSpeaking: updated.isSpeaking
      });
    }
  });
}
