"use client";

import { useEffect, useRef, useState } from "react";
import { GenericSlotLead } from "@/components/organisms/generic-landing/GenericSlotLead";
import type { Dictionary } from "@/types/i18n";
import styles from "./musicaDos.module.css";

type Copy = Dictionary["landing"]["genericLandings"]["musica2"];

const NOTES = [
  { id: "C4", name: "C", freq: 261.63, key: "a" },
  { id: "Cs4", name: "C#", freq: 277.18, key: "w" },
  { id: "D4", name: "D", freq: 293.66, key: "s" },
  { id: "Ds4", name: "D#", freq: 311.13, key: "e" },
  { id: "E4", name: "E", freq: 329.63, key: "d" },
  { id: "F4", name: "F", freq: 349.23, key: "f" },
  { id: "Fs4", name: "F#", freq: 369.99, key: "t" },
  { id: "G4", name: "G", freq: 392, key: "g" },
  { id: "Gs4", name: "G#", freq: 415.3, key: "y" },
  { id: "A4", name: "A", freq: 440, key: "h" },
  { id: "As4", name: "A#", freq: 466.16, key: "u" },
  { id: "B4", name: "B", freq: 493.88, key: "j" },
  { id: "C5", name: "C5", freq: 523.25, key: "k" },
] as const;

export function MusicaDosLab({
  copy,
  lead,
}: {
  copy: Copy;
  lead?: { title: string; body: string };
}) {
  const audio = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [bars, setBars] = useState<number[]>(() => NOTES.map(() => 28));
  const [volume, setVolume] = useState(0.2);
  const [muted, setMuted] = useState(false);
  const [fallback, setFallback] = useState(false);
  const volumeRef = useRef(volume);
  const mutedRef = useRef(muted);
  useEffect(() => {
    volumeRef.current = volume;
    mutedRef.current = muted;
  }, [volume, muted]);

  function context() {
    const Ctx = window.AudioContext;
    if (!Ctx) {
      setFallback(true);
      return null;
    }
    if (!audio.current) audio.current = new Ctx();
    if (!master.current) {
      master.current = audio.current.createGain();
      master.current.connect(audio.current.destination);
    }
    if (audio.current.state === "suspended") void audio.current.resume();
    return audio.current;
  }

  function play(id: string) {
    const note = NOTES.find((item) => item.id === id);
    if (!note) return;
    setActive(id);
    setBars(NOTES.map(() => 16 + Math.round(Math.random() * 84)));
    window.setTimeout(() => setActive(null), 220);
    if (mutedRef.current) return;
    const ctx = context();
    if (!ctx || !master.current) return;
    master.current.gain.setValueAtTime(1, ctx.currentTime);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = note.freq;
    const level = Math.max(0.001, volumeRef.current);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(level, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(master.current);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  function stop() {
    const ctx = audio.current;
    if (ctx && master.current) master.current.gain.setTargetAtTime(0.001, ctx.currentTime, 0.02);
    setActive(null);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      const note = NOTES.find((item) => item.key === event.key.toLowerCase());
      if (!note) return;
      event.preventDefault();
      play(note.id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section id="modalidades" className={styles.block}>
      {lead ? <GenericSlotLead section="modalidades" title={lead.title} body={lead.body} /> : null}
      <div className={styles.bars} aria-hidden>
        {bars.map((height, index) => (
          <span key={NOTES[index]?.id ?? index} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className={`${styles.actions} mt-4`}>
        <button type="button" className={styles.cta} onClick={() => play("C4")}>{copy.audioOn}</button>
        <button type="button" className={styles.ghost} onClick={stop}>{copy.audioStop}</button>
        <button type="button" className={styles.ghost} aria-pressed={muted} onClick={() => setMuted((value) => !value)}>
          {muted ? copy.audioOnAgain : copy.audioMute}
        </button>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm">
          {copy.volume}
          <input
            type="range"
            min="0.05"
            max="0.4"
            step="0.05"
            value={volume}
            aria-label={copy.volume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
        </label>
      </div>
      {fallback ? <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{copy.audioFallback}</p> : null}
      <div className={styles.keys}>
        {NOTES.map((note) => (
          <button
            key={note.id}
            type="button"
            className={styles.key}
            aria-pressed={active === note.id}
            aria-label={note.name}
            onClick={() => play(note.id)}
          >
            {note.name}
          </button>
        ))}
      </div>
    </section>
  );
}
