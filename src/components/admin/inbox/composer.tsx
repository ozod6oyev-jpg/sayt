"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Paperclip, Send, Sparkles, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Copy = {
  placeholder: string;
  send: string;
  attach: string;
  attachHint: string;
  removeFile: string;
  record: string;
  recording: string;
  cancelRecording: string;
  micDenied: string;
  quickReplies: string;
  quick1: string;
  quick2: string;
  quick3: string;
  sending: string;
  failed: string;
};

export function InboxComposer({
  kind,
  chatId,
  copy,
  onSend,
}: {
  kind: "telegram" | "meta";
  chatId: string;
  copy: Copy;
  /** true — xabar qabul qilindi; false — matn qaytariladi */
  onSend: (payload: FormData) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micError, setMicError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const stopResolveRef = useRef<((file: File | null) => void) | null>(null);

  // Yozish davomiyligi
  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  function pick(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  function addQuick(value: string) {
    setText((current) => (current ? `${current} ${value}` : value));
    textRef.current?.focus();
  }

  /** Brauzer qo'llab-quvvatlaydigan eng yaxshi ovoz formatini tanlaydi */
  function voiceMime(): string {
    const options = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"];
    return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
  }

  async function startRecording() {
    if (recording || sending) return;

    setMicError(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = voiceMime();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      cancelledRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        recorderRef.current = null;
        setRecording(false);
        setSeconds(0);

        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];

        const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const next =
          cancelledRef.current || blob.size === 0
            ? null
            : new File([blob], `voice.${extension}`, { type });

        stopResolveRef.current?.(next);
        stopResolveRef.current = null;
      };

      recorder.start();
      recorderRef.current = recorder;
      setSeconds(0);
      setRecording(true);
    } catch {
      setMicError(true);
    }
  }

  /** Yozishni to'xtatib, tayyor faylni qaytaradi (bekor qilinsa null) */
  function stopRecording(): Promise<File | null> {
    const recorder = recorderRef.current;
    if (!recorder) return Promise.resolve(null);

    return new Promise((resolve) => {
      stopResolveRef.current = resolve;
      recorder.stop();
    });
  }

  async function cancelRecording() {
    cancelledRef.current = true;
    await stopRecording();
  }

  async function submit() {
    if (sending) return;

    const body = text.trim();
    const voice = recording ? await stopRecording() : null;
    const outgoing = voice ?? file;

    if (!body && !outgoing) return;

    const payload = new FormData();
    payload.set("kind", kind);
    payload.set("chatId", chatId);
    payload.set("text", body);
    if (outgoing) payload.set("media", outgoing);

    const snapshot = text;
    const snapshotFile = file;

    setSending(true);
    setFailed(false);
    setText("");
    pick(null);
    if (fileRef.current) fileRef.current.value = "";

    const ok = await onSend(payload);

    setSending(false);

    if (!ok) {
      setFailed(true);
      setText(snapshot);
      if (snapshotFile) pick(snapshotFile);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="shrink-0 border-t border-border bg-card p-2.5"
    >
      {kind === "telegram" && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            <Sparkles className="size-3" />
            {copy.quickReplies}
          </span>
          {[copy.quick1, copy.quick2, copy.quick3].map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => addQuick(reply)}
              className="max-w-full truncate rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {recording && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
          <span className="size-2 shrink-0 animate-pulse rounded-full bg-red-600" />
          <span className="text-[11px] font-semibold text-red-700">
            {copy.recording} {String(Math.floor(seconds / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")}
          </span>

          <button
            type="button"
            onClick={() => void cancelRecording()}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-100"
          >
            <X className="size-3" />
            {copy.cancelRecording}
          </button>
        </div>
      )}

      {file && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-1.5">
          {preview && file.type.startsWith("audio/") ? (
            <audio src={preview} controls className="h-9 w-40 shrink-0" />
          ) : preview && file.type.startsWith("video/") ? (
            <video src={preview} className="size-12 rounded object-cover" muted playsInline />
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-12 rounded object-cover" />
          ) : null}

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-foreground">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              pick(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-red-600"
            aria-label={copy.removeFile}
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {kind === "telegram" && (
          <label
            title={copy.attachHint}
            className={cn(
              "grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              file && "border-brand-700 text-brand-700",
            )}
          >
            <Paperclip className="size-4" />
            <input
              ref={fileRef}
              type="file"
              name="media"
              accept="image/*,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(event) => pick(event.target.files?.[0] ?? null)}
            />
          </label>
        )}

        {kind === "telegram" && (
          <button
            type="button"
            onClick={() => void startRecording()}
            disabled={recording || sending}
            title={copy.record}
            aria-label={copy.record}
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60",
              recording && "border-red-300 bg-red-50 text-red-600",
            )}
          >
            {recording ? <Square className="size-3.5" /> : <Mic className="size-4" />}
          </button>
        )}

        <textarea
          ref={textRef}
          name="text"
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={copy.placeholder}
          className="field max-h-32 min-h-10 flex-1 resize-none py-2"
        />

        <button
          type="submit"
          disabled={sending || (!text.trim() && !file && !recording)}
          className="btn-primary inline-flex h-10 shrink-0 items-center gap-1.5 px-3 text-xs disabled:opacity-70"
        >
          {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          <span className="hidden sm:inline">{sending ? copy.sending : copy.send}</span>
        </button>
      </div>

      {micError && <p className="mt-1 text-[10px] font-medium text-red-600">{copy.micDenied}</p>}

      {failed && <p className="mt-1 text-[10px] font-medium text-red-600">{copy.failed}</p>}

      {file && !failed && (
        <p className="mt-1 text-[10px] text-muted-foreground">{copy.attachHint}</p>
      )}
    </form>
  );
}
