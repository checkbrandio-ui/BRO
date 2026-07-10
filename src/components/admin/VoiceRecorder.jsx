import { useState, useRef } from 'react';
import { Mic, Square, Loader2, FileAudio, AlertCircle } from 'lucide-react';
import { uploadWithRetry } from '@/lib/uploadWithRetry';
import { base44 } from '@/api/base44Client';

/**
 * Диктофон для записи разговоров.
 * Использует MediaRecorder API браузера.
 * Запись загружается в хранилище, затем транскрибируется через Whisper.
 * Очистка записей старше 30 дней — через automation cleanupOldRecordings.
 */
export default function VoiceRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    setTranscript(null);
    setDuration(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `call-${Date.now()}.webm`, { type: 'audio/webm' });
        setUploading(true);
        try {
          const url = await uploadWithRetry(file);
          setAudioUrl(url);
          // Автоматическая транскрибация
          setTranscribing(true);
          try {
            const result = await base44.integrations.Core.TranscribeAudio({ audio_url: url });
            setTranscript(result);
            onRecorded?.(url, result);
          } catch (e) {
            onRecorded?.(url, null);
          }
          setTranscribing(false);
        } catch (e) {
          setError('Не удалось загрузить запись. Проверьте подключение.');
        }
        setUploading(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (e) {
      setError('Нет доступа к микрофону. Разрешите доступ в браузере.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!navigator.mediaDevices?.getUserMedia) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-xs text-[#F8FAFC]/40">
        <AlertCircle size={14} className="flex-shrink-0" />
        Запись разговора недоступна в этом браузере
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {!recording ? (
          <button type="button" onClick={startRecording} disabled={uploading || transcribing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-xs disabled:opacity-50">
            <Mic size={14} /> Начать запись
          </button>
        ) : (
          <button type="button" onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-xs">
            <Square size={14} /> Остановить ({formatDuration(duration)})
          </button>
        )}
        {uploading && (
          <span className="flex items-center gap-1.5 text-xs text-[#F8FAFC]/40">
            <Loader2 size={12} className="animate-spin" /> Загрузка...
          </span>
        )}
        {transcribing && (
          <span className="flex items-center gap-1.5 text-xs text-[#F8FAFC]/40">
            <Loader2 size={12} className="animate-spin" /> Транскрибация...
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {audioUrl && (
        <div className="p-2.5 rounded-lg bg-[rgba(123,63,191,0.06)] border border-[rgba(123,63,191,0.15)] space-y-2">
          <div className="flex items-center gap-2">
            <FileAudio size={14} className="text-[#7B3FBF] flex-shrink-0" />
            <audio controls src={audioUrl} className="h-8 flex-1 min-w-0" />
          </div>
          {transcript && (
            <div className="text-xs text-[#F8FAFC]/50 bg-[rgba(255,255,255,0.03)] rounded p-2 max-h-24 overflow-y-auto">
              <span className="font-bold text-[#F8FAFC]/60">Транскрипция:</span> {transcript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}