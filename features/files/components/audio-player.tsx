"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/features/files/lib/format";

const BAR_COUNT = 72;

function computePeaks(buffer: AudioBuffer, barCount: number): number[] {
  const channel = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channel.length / barCount));
  const peaks: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize; j++) {
      const value = Math.abs(channel[start + j] ?? 0);
      if (value > max) max = value;
    }
    peaks.push(max);
  }

  const overallMax = Math.max(...peaks, 0.01);
  return peaks.map((peak) => peak / overallMax);
}

export function AudioPlayer({
  src,
  autoPlay = false,
  onPlayStateChange,
}: {
  src: string;
  autoPlay?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(autoPlay);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const AudioContextClass =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();

    fetch(src)
      .then((res) => res.arrayBuffer())
      .then((buffer) => audioContext.decodeAudioData(buffer))
      .then((decoded) => {
        if (!cancelled) setPeaks(computePeaks(decoded, BAR_COUNT));
      })
      .catch(() => {
        if (!cancelled) setPeaks(new Array(BAR_COUNT).fill(0.3));
      })
      .finally(() => audioContext.close());

    return () => {
      cancelled = true;
    };
  }, [src]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }

  function handleSeek(event: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const waveform = waveformRef.current;
    if (!audio || !waveform || duration === 0) return;
    const rect = waveform.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audio.currentTime = fraction * duration;
    setCurrentTime(audio.currentTime);
  }

  function updateBufferedPercent(audio: HTMLAudioElement) {
    if (audio.duration === 0 || audio.buffered.length === 0) return;
    const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
    setBufferedPercent(Math.round((bufferedEnd / audio.duration) * 100));
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        autoPlay={autoPlay}
        onPlay={() => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          onPlayStateChange?.(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          onPlayStateChange?.(false);
        }}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => setIsBuffering(false)}
        onProgress={(e) => updateBufferedPercent(e.currentTarget)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        className="hidden"
      />
      <Button variant="ghost" size="icon-sm" onClick={togglePlay} disabled={!peaks}>
        {isBuffering ? (
          <Loader2 className="animate-spin" />
        ) : isPlaying ? (
          <Pause />
        ) : (
          <Play />
        )}
        <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
      </Button>

      <div
        ref={waveformRef}
        onClick={handleSeek}
        className="relative flex h-10 flex-1 cursor-pointer items-center gap-[2px]"
      >
        {(peaks ?? new Array(BAR_COUNT).fill(0.2)).map((peak, index) => {
          const barPosition = index / BAR_COUNT;
          const played = barPosition <= progress;
          const buffered = barPosition <= bufferedPercent / 100;
          const barColor = played
            ? "bg-primary"
            : buffered
              ? "bg-muted-foreground/50"
              : "bg-muted-foreground/20";
          return (
            <div
              key={index}
              className={`w-full rounded-full ${barColor} ${peaks ? "" : "animate-pulse"}`}
              style={{ height: `${Math.max(peak * 100, 10)}%` }}
            />
          );
        })}
        <div
          className="absolute top-0 h-full w-0.5 rounded-full bg-foreground"
          style={{ left: `${progress * 100}%` }}
        />
      </div>

      <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {isBuffering ? `Buffering ${bufferedPercent}%` : `${formatDuration(currentTime)} / ${formatDuration(duration)}`}
      </span>
    </div>
  );
}
