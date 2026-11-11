'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';

export interface DialogField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  helperText?: string;
}

interface EditDialogProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  fields: DialogField[];
  initialValues: Record<string, any>;
  onClose: () => void;
  onSave: (values: Record<string, any>) => void;
  saveButtonText?: string;
}

export const EditDialog: React.FC<EditDialogProps> = ({
  isOpen,
  title,
  subtitle,
  fields,
  initialValues,
  onClose,
  onSave,
  saveButtonText = 'Save Changes',
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(initialValues || {});
    setErrors({});
  }, [initialValues, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    fields.forEach((f) => {
      if (f.required && (formData[f.name] === undefined || formData[f.name] === '')) {
        newErrors[f.name] = `${f.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-black text-base text-slate-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-3.5 text-xs">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 text-xs">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                {field.helperText && <span className="text-[10px] text-slate-400">{field.helperText}</span>}
              </div>

              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full p-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition ${
                    errors[field.name] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`w-full p-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition cursor-pointer ${
                    errors[field.name] ? 'border-rose-400' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[field.name])}
                    onChange={(e) => handleChange(field.name, e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800 text-xs">{field.placeholder || field.label}</span>
                </label>
              ) : (
                <input
                  type={field.type}
                  value={formData[field.name] ?? ''}
                  onChange={(e) => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full p-2.5 rounded-xl border bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition ${
                    errors[field.name] ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  }`}
                />
              )}

              {errors[field.name] && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors[field.name]}</span>
                </p>
              )}
            </div>
          ))}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saveButtonText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

