'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Check, MessageSquare } from 'lucide-react';
import {
  isListerAutoReplyEnabled,
  setListerAutoReplyEnabled,
  getListerCustomAutoReply,
  setListerCustomAutoReply,
} from '@/data/chatEngine';

interface ListerAutoReplyPanelProps {
  listerId?: string;
  compact?: boolean;
  onSaved?: () => void;
}

const PRESET_TEMPLATES = [
  'Assalam-o-Alaikum {customer}! Thanks for inquiring about {listing}. Our team is reviewing your dates — call or WhatsApp us at {phone} for instant confirmation.',
  'Hello {customer}! {listing} is available. Please share your pickup time or reach us directly on WhatsApp ({phone}).',
  'We are currently assisting a client. For urgent booking of {listing}, please call or WhatsApp {phone}.',
];

export function ListerAutoReplyPanel({ listerId, compact = false, onSaved }: ListerAutoReplyPanelProps) {
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!listerId) return;
    setEnabled(isListerAutoReplyEnabled(listerId));
    setMessage(getListerCustomAutoReply(listerId));
  }, [listerId]);

  const handleToggle = () => {
    if (!listerId) return;
    const next = !enabled;
    setListerAutoReplyEnabled(listerId, next);
    setEnabled(next);
  };

  const handleSave = () => {
    if (!listerId) return;
    setListerCustomAutoReply(listerId, message);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
    onSaved?.();
  };

  return (
    <div className={`${compact ? 'p-4' : 'p-5'} bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0B6B4F] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-extrabold text-sm text-slate-900 truncate">
              Chat Auto-Response Settings
            </h4>
            <p className="text-[11px] text-slate-500">
              Automatically reply to customers when they message you in Inbox.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          className={`px-3 py-1.5 rounded-full font-extrabold text-[11px] border transition cursor-pointer shrink-0 ${
            enabled
              ? 'bg-emerald-50 border-emerald-300 text-[#0B6B4F]'
              : 'bg-slate-100 border-slate-300 text-slate-600'
          }`}
        >
          {enabled ? 'Auto-Reply: ON' : 'Auto-Reply: OFF'}
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="font-bold text-slate-700 block">
          Custom Auto-Response Message (Optional)
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Assalam-o-Alaikum {customer}! Thank you for inquiring about {listing}. Call or WhatsApp {phone} for instant confirmation."
          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B6B4F] outline-none text-xs text-slate-900 leading-relaxed"
        />
        <p className="text-[10px] text-slate-500">
          Tip: You can use <code className="px-1 py-0.5 bg-slate-100 rounded">{'{customer}'}</code>,{' '}
          <code className="px-1 py-0.5 bg-slate-100 rounded">{'{listing}'}</code>, and{' '}
          <code className="px-1 py-0.5 bg-slate-100 rounded">{'{phone}'}</code> placeholders. Leave empty to use the default SafarPK greeting.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESET_TEMPLATES.map((tpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setMessage(tpl)}
            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-[10px] font-bold text-slate-700 hover:text-[#0B6B4F] transition cursor-pointer flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Preset {idx + 1}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        {savedNotice ? (
          <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
            <Check className="w-3.5 h-3.5" />
            <span>Auto-response saved!</span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Saved per lister account</span>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-bold text-xs transition cursor-pointer shadow-xs"
        >
          Save Auto-Response
        </button>
      </div>
    </div>
  );
}

