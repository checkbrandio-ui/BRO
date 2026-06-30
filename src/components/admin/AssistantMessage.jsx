import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, ChevronDown, ChevronRight, CheckCircle, AlertCircle, Wrench } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  const ToolCallDisplay = ({ toolCall }) => {
    const [expanded, setExpanded] = useState(false);
    let status = toolCall.status || 'pending';
    const isFailed = ['failed', 'error'].includes(status);
    const isRunning = ['pending', 'running', 'in_progress'].includes(status);

    let parsedResults = toolCall.results;
    if (typeof parsedResults === 'string') {
      try { parsedResults = JSON.parse(parsedResults); } catch (_) {}
    }
    const isResultError = typeof parsedResults === 'object' && parsedResults?.error;

    let parsedArgs = toolCall.arguments_string;
    if (typeof parsedArgs === 'string') {
      try { parsedArgs = JSON.parse(parsedArgs); } catch (_) {}
    }

    const projection = toolCall.display_projection || {};
    const hideDetails = projection.hide_details && projection.details_redacted;

    const statusIcon = isFailed || isResultError
      ? <AlertCircle size={11} className="text-red-400" />
      : isRunning
        ? <Loader2 size={11} className="animate-spin text-[#C9A84C]" />
        : <CheckCircle size={11} className="text-green-400" />;

    const statusText = isFailed || isResultError
      ? (projection.error_label || 'Ошибка')
      : isRunning
        ? (projection.active_label || 'Выполняется...')
        : (projection.label || 'Готово');

    const fnName = toolCall.name || 'функция';

    return (
      <div className="mt-2 border border-[rgba(123,63,191,0.15)] rounded-lg overflow-hidden bg-[rgba(123,63,191,0.04)]">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[rgba(123,63,191,0.08)] transition-colors"
        >
          {hideDetails ? (
            <ChevronRight size={11} className="text-[#F8FAFC]/30 flex-shrink-0" />
          ) : (
            expanded ? <ChevronDown size={11} className="text-[#F8FAFC]/30 flex-shrink-0" />
                     : <ChevronRight size={11} className="text-[#F8FAFC]/30 flex-shrink-0" />
          )}
          <Wrench size={11} className="text-[#7B3FBF]/60 flex-shrink-0" />
          <span className="text-xs font-medium text-[#F8FAFC]/60 truncate flex-1">{fnName}</span>
          {statusIcon}
          <span className="text-xs text-[#F8FAFC]/35">{statusText}</span>
        </button>
        {!hideDetails && expanded && (
          <div className="px-3 pb-3 pt-1 space-y-2 border-t border-[rgba(123,63,191,0.1)]">
            {parsedArgs && Object.keys(parsedArgs).length > 0 && (
              <div>
                <div className="text-xs text-[#F8FAFC]/30 mb-1 font-semibold">Параметры:</div>
                <pre className="text-xs text-[#F8FAFC]/50 overflow-x-auto bg-[#05070A] rounded p-2">{JSON.stringify(parsedArgs, null, 2)}</pre>
              </div>
            )}
            {parsedResults != null && (
              <div>
                <div className="text-xs text-[#F8FAFC]/30 mb-1 font-semibold">Результат:</div>
                <pre className={`text-xs overflow-x-auto bg-[#05070A] rounded p-2 ${isResultError ? 'text-red-400/70' : 'text-[#F8FAFC]/50'}`}>{typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div className={`max-w-[85%] ${isUser ? 'ml-auto' : ''}`}>
        {message.content && (
          isUser ? (
            <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-[#7B3FBF] text-white text-sm">
              {message.content}
            </div>
          ) : (
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#0D1B3E] border border-[rgba(123,63,191,0.2)]">
              <ReactMarkdown className="text-sm text-[#F8FAFC]/85 prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-1 [&_strong]:text-[#C9A84C] [&_code]:bg-[#05070A] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#7B3FBF]">
                {message.content}
              </ReactMarkdown>
            </div>
          )
        )}
        {message.tool_calls?.map((tc, i) => <ToolCallDisplay key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}