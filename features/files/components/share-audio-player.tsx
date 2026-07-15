"use client";

import { AudioPlayer } from "@/features/files/components/audio-player";

export function ShareAudioPlayer({ token }: { token: string }) {
  function handlePlayStateChange(isPlaying: boolean) {
    if (isPlaying) {
      fetch(`/api/share/${token}/track`, { method: "POST" }).catch(() => {});
    }
  }

  return (
    <AudioPlayer
      src={`/api/share/${token}/stream`}
      onPlayStateChange={handlePlayStateChange}
    />
  );
}
