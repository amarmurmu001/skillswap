import { supabase } from './supabase';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export async function requestMedia() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    return stream;
  } catch (err) {
    console.error('[CallEngine] getUserMedia error:', err.name, err.message);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      return stream;
    } catch (err2) {
      console.error('[CallEngine] getUserMedia audio-only error:', err2.name, err2.message);
      let msg;
      if (err.name === 'NotAllowedError' || err2.name === 'NotAllowedError') {
        msg = 'Camera and microphone access denied. Please allow access in your browser settings and reload.';
      } else if (err.name === 'NotFoundError' || err2.name === 'NotFoundError') {
        msg = 'No camera or microphone found. Connect a device and try again.';
      } else if (err.name === 'NotReadableError' || err2.name === 'NotReadableError') {
        msg = 'Camera or microphone is in use by another app. Close it and try again.';
      } else {
        msg = 'Could not access camera or microphone. Make sure you are on HTTPS or localhost.';
      }
      throw new Error(msg);
    }
  }
}

export default class CallEngine {
  constructor() {
    this.channel = null;
    this.roomName = '';
    this.userId = '';
    this.displayName = '';
    this.localStream = null;
    this.screenStream = null;
    this.isScreenSharing = false;
    this.pc = null;
    this.remoteUserId = null;
    this._listeners = {};
    this._pendingCandidates = [];
    this._joined = false;
  }

  on(event, fn) {
    (this._listeners[event] ??= []).push(fn);
    return () => this._off(event, fn);
  }

  _off(event, fn) {
    const list = this._listeners[event];
    if (list) this._listeners[event] = list.filter(f => f !== fn);
  }

  _emit(event, data) {
    (this._listeners[event] ?? []).forEach(fn => fn(data));
  }

  async join(roomName, userId, displayName) {
    this.roomName = roomName;
    this.userId = userId;
    this.displayName = displayName;

    const topic = `call:${roomName}`;
    this.channel = supabase.channel(topic, {
      config: { broadcast: { self: true } },
    });

    this.channel
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        if (payload.userId !== this.userId) {
          this.remoteUserId = payload.userId;
          this._emit('peer-joined', payload);
          this._createPeerConnection(true);
        }
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.targetUserId !== this.userId) return;
        try { await this._handleOffer(payload); } catch (err) { console.error(err); }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.targetUserId !== this.userId) return;
        try { await this._handleAnswer(payload); } catch (err) { console.error(err); }
      })
      .on('broadcast', { event: 'ice' }, async ({ payload }) => {
        if (payload.targetUserId !== this.userId) return;
        try {
          const candidate = new RTCIceCandidate(payload.candidate);
          if (this.pc && this.pc.remoteDescription) {
            await this.pc.addIceCandidate(candidate);
          } else {
            this._pendingCandidates.push(candidate);
          }
        } catch (err) { console.error(err); }
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        if (payload.userId !== this.userId) {
          this._emit('peer-left', payload);
          this._cleanupPC();
        }
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        if (payload.userId !== this.userId) {
          this._emit('chat-message', payload);
        }
      })
      .on('broadcast', { event: 'screen-change' }, ({ payload }) => {
        if (payload.userId !== this.userId) {
          this._emit('peer-screen-change', payload);
        }
      });

    await this.channel.subscribe();
    this._joined = true;

    await this._broadcast('join', { userId, displayName });
    this._emit('local-stream', this.localStream);
  }

  async _broadcast(event, payload) {
    if (this.channel) {
      await this.channel.send({ type: 'broadcast', event, payload });
    }
  }

  async _createPeerConnection(shouldOffer) {
    this._cleanupPC();
    this.pc = new RTCPeerConnection(ICE_SERVERS);
    this._pendingCandidates = [];

    this.localStream.getTracks().forEach(track => {
      this.pc.addTrack(track, this.localStream);
    });

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        this.pc.addTrack(track, this.screenStream);
      });
    }

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this._broadcast('ice', {
          targetUserId: this.remoteUserId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    this.pc.ontrack = (e) => {
      if (e.streams[0]) this._emit('remote-stream', e.streams[0]);
    };

    this.pc.onconnectionstatechange = () => {
      this._emit('state-change', this.pc.connectionState);
      if (['disconnected', 'failed', 'closed'].includes(this.pc.connectionState)) {
        this._cleanupPC();
      }
    };

    if (shouldOffer) {
      try {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this._broadcast('offer', {
          targetUserId: this.remoteUserId,
          sdp: this.pc.localDescription,
        });
      } catch (err) { console.error(err); }
    }
  }

  async _handleOffer(payload) {
    if (!this.pc) await this._createPeerConnection(false);
    if (!this.pc) return;

    if (this.pc.signalingState !== 'stable') {
      await Promise.all([
        this.pc.setLocalDescription({ type: 'rollback' }),
        this.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp)),
      ]);
    } else {
      await this.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    }

    for (const c of this._pendingCandidates) {
      try { await this.pc.addIceCandidate(c); } catch {}
    }
    this._pendingCandidates = [];

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this._broadcast('answer', {
      targetUserId: payload.userId,
      sdp: this.pc.localDescription,
    });
  }

  async _handleAnswer(payload) {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

    for (const c of this._pendingCandidates) {
      try { await this.pc.addIceCandidate(c); } catch {}
    }
    this._pendingCandidates = [];
  }

  toggleAudio() {
    const track = this.localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      return track.enabled;
    }
    return false;
  }

  toggleVideo() {
    const track = this.localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      return track.enabled;
    }
    return false;
  }

  async toggleScreenShare() {
    if (this.isScreenSharing) {
      this.screenStream?.getTracks().forEach(t => t.stop());
      this.screenStream = null;
      this.isScreenSharing = false;

      if (this.pc) {
        const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          const camTrack = this.localStream?.getVideoTracks()[0];
          await sender.replaceTrack(camTrack || null);
        }
      }
      this._broadcast('screen-change', { userId: this.userId, active: false });
      return 'camera';
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = this.screenStream.getVideoTracks()[0];
      this.isScreenSharing = true;

      if (this.pc) {
        const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          this.pc.addTrack(screenTrack, this.screenStream);
        }
      }

      screenTrack.onended = () => {
        this.isScreenSharing = false;
        this.screenStream = null;
        if (this.pc) {
          const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            const camTrack = this.localStream?.getVideoTracks()[0];
            sender.replaceTrack(camTrack || null);
          }
        }
        this._broadcast('screen-change', { userId: this.userId, active: false });
        this._emit('screen-share-ended');
      };

      this._broadcast('screen-change', { userId: this.userId, active: true });
      return 'screen';
    } catch {
      return 'camera';
    }
  }

  sendChatMessage(text) {
    if (!text.trim()) return;
    this._broadcast('chat', {
      userId: this.userId,
      displayName: this.displayName,
      text: text.trim(),
      timestamp: Date.now(),
    });
  }

  async leave() {
    if (this._joined) {
      await this._broadcast('leave', { userId: this.userId });
    }
    this._cleanup();
  }

  _cleanupPC() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this._pendingCandidates = [];
    this.remoteUserId = null;
    this._emit('remote-stream', null);
  }

  _cleanup() {
    this._cleanupPC();
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;
    this.screenStream?.getTracks().forEach(t => t.stop());
    this.screenStream = null;
    this.isScreenSharing = false;
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this._joined = false;
    this._emit('state-change', 'closed');
  }
}
