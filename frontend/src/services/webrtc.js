import socket from './socket.js';

class WebRTCVoiceManager {
  constructor() {
    this.localStream = null;
    this.peers = new Map(); // socketId -> RTCPeerConnection
    this.audioElements = new Map(); // socketId -> HTMLAudioElement
    this.isMuted = false;
    this.isSpeaking = false;
    this.audioContext = null;
    this.analyser = null;
    this.vadInterval = null;
    this.username = null;
    this.initialized = false;
    this.listeners = new Set();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const cb of this.listeners) {
      cb({
        isMuted: this.isMuted,
        isSpeaking: this.isSpeaking,
        initialized: this.initialized,
        hasPermission: !!this.localStream
      });
    }
  }

  async init(username) {
    if (this.initialized) return;
    this.username = username;

    try {
      // Request microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      this.initialized = true;
      this.setupVAD();
      this.setupSocketListeners();

      // Announce presence in voice mesh
      socket.emit('voice-join', { username });
      this.notify();
      console.log('WebRTC Voice initialized successfully.');
    } catch (err) {
      console.warn('Microphone access denied or error:', err.message);
      this.initialized = false;
      this.notify();
    }
  }

  setupVAD() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.vadInterval = setInterval(() => {
        if (!this.localStream || this.isMuted) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            socket.emit('voice-speaking-toggle', { isSpeaking: false });
            this.notify();
          }
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const speakingNow = avg > 20;

        if (speakingNow !== this.isSpeaking) {
          this.isSpeaking = speakingNow;
          socket.emit('voice-speaking-toggle', { isSpeaking: speakingNow });
          this.notify();
        }
      }, 120);
    } catch (e) {
      console.error('VAD setup failed:', e);
    }
  }

  setupSocketListeners() {
    // When a peer joins, initiate offer if this socket has lower or higher id
    socket.on('voice-peer-joined', async ({ socketId }) => {
      console.log('Peer joined voice:', socketId);
      await this.createPeerConnection(socketId, true);
    });

    socket.on('voice-offer', async ({ fromSocketId, offer }) => {
      console.log('Received offer from:', fromSocketId);
      const pc = await this.createPeerConnection(fromSocketId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('voice-answer', { toSocketId: fromSocketId, answer });
    });

    socket.on('voice-answer', async ({ fromSocketId, answer }) => {
      console.log('Received answer from:', fromSocketId);
      const pc = this.peers.get(fromSocketId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('voice-ice-candidate', async ({ fromSocketId, candidate }) => {
      const pc = this.peers.get(fromSocketId);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate:', e);
        }
      }
    });

    socket.on('voice-peer-left', ({ socketId }) => {
      this.closePeer(socketId);
    });
  }

  async createPeerConnection(targetSocketId, isInitiator) {
    if (this.peers.has(targetSocketId)) {
      return this.peers.get(targetSocketId);
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.peers.set(targetSocketId, pc);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle remote track
    pc.ontrack = (event) => {
      console.log('Received remote audio track from:', targetSocketId);
      let audio = this.audioElements.get(targetSocketId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        this.audioElements.set(targetSocketId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.play().catch(e => console.warn('Audio play error:', e.message));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice-ice-candidate', {
          toSocketId: targetSocketId,
          candidate: event.candidate
        });
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice-offer', { toSocketId: targetSocketId, offer });
      } catch (err) {
        console.error('Failed to create offer:', err);
      }
    }

    return pc;
  }

  toggleMute() {
    if (!this.localStream) return;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this.isMuted;
    });

    socket.emit('voice-mute-toggle', { isMuted: this.isMuted });
    this.notify();
    return this.isMuted;
  }

  closePeer(socketId) {
    const pc = this.peers.get(socketId);
    if (pc) {
      pc.close();
      this.peers.delete(socketId);
    }
    const audio = this.audioElements.get(socketId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      this.audioElements.delete(socketId);
    }
  }

  destroy() {
    clearInterval(this.vadInterval);
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
    }
    for (const [id] of this.peers) {
      this.closePeer(id);
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
    }
    this.initialized = false;
  }
}

export const voiceManager = new WebRTCVoiceManager();
export default voiceManager;
