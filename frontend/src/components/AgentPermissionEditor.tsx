'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Check,
  Search,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import {
  ENTERPRISE_PERMISSION_TREE,
  getAllAvailablePermissionIds,
  PREDEFINED_AGENT_TEMPLATES,
  PermissionModule,
} from '@/data/agentPermissions';

interface AgentPermissionEditorProps {
  initialPermissions: string[];
  agentName: string;
  onSave: (permissions: string[]) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function AgentPermissionEditor({
  initialPermissions,
  agentName,
  onSave,
  onCancel,
  isSaving = false,
}: AgentPermissionEditorProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialPermissions || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    customer: true,
    listing: true,
    driver: true,
    payment: true,
    booking: true,
    complaint: true,
    reports: true,
    platform: true,
  });

  const allAvailableIds = useMemo(() => getAllAvailablePermissionIds(), []);

  // Filter tree based on search query
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return ENTERPRISE_PERMISSION_TREE;
    const q = searchQuery.toLowerCase().trim();

    return ENTERPRISE_PERMISSION_TREE.map((mod) => {
      const filteredSubs = mod.submodules.map((sub) => {
        const filteredActs = sub.actions.filter(
          (act) =>
            act.id.toLowerCase().includes(q) ||
            act.label.toLowerCase().includes(q) ||
            act.description.toLowerCase().includes(q)
        );
        return { ...sub, actions: filteredActs };
      }).filter((sub) => sub.actions.length > 0 || sub.label.toLowerCase().includes(q));

      return { ...mod, submodules: filteredSubs };
    }).filter((mod) => mod.submodules.length > 0 || mod.label.toLowerCase().includes(q));
  }, [searchQuery]);

  const togglePermission = (actionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  };

  const toggleModuleAll = (mod: PermissionModule) => {
    const modActionIds: string[] = [];
    mod.submodules.forEach((s) => s.actions.forEach((a) => modActionIds.push(a.id)));

    const allSelected = modActionIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      // Uncheck all in this module
      setSelectedPermissions((prev) => prev.filter((id) => !modActionIds.includes(id)));
    } else {
      // Check all in this module
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modActionIds])));
    }
  };

  const handleSelectAll = () => {
    setSelectedPermissions([...allAvailableIds]);
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const applyTemplate = (templateKey: string) => {
    const tpl = PREDEFINED_AGENT_TEMPLATES[templateKey];
    if (tpl) {
      setSelectedPermissions([...tpl.permissions]);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-h-[85vh] overflow-y-auto pr-1">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900">
              Configure Permissions for {agentName}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hierarchical enterprise role matrix. Selected actions will be enforced on both the Agent Portal and backend APIs.
          </p>
        </div>

        {/* Global Select/Clear Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Preset Role Templates (Shopify Style) */}
      <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Apply Predefined Role Template:</span>
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(PREDEFINED_AGENT_TEMPLATES).map(([key, tpl]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyTemplate(key)}
              title={tpl.description}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition shadow-2xs"
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter permissions by keyword (e.g. approve, view, suspend)..."
          className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-emerald-500"
        />
      </div>

      {/* Hierarchical Tree */}
      <div className="flex flex-col gap-4">
        {filteredTree.map((mod) => {
          const modActionIds: string[] = [];
          mod.submodules.forEach((s) => s.actions.forEach((a) => modActionIds.push(a.id)));
          const selectedInMod = modActionIds.filter((id) => selectedPermissions.includes(id));
          const allSelected = modActionIds.length > 0 && selectedInMod.length === modActionIds.length;
          const isExpanded = expandedModules[mod.id] ?? true;

          return (
            <div
              key={mod.id}
              className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-2xs"
            >
              {/* Module Header */}
              <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedInMod.length > 0 && !allSelected;
                    }}
                    onChange={() => toggleModuleAll(mod)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <h4 className="font-heading font-extrabold text-sm text-slate-900">{mod.label}</h4>
                    <p className="text-[11px] text-slate-500">{mod.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                    {selectedInMod.length}/{modActionIds.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedModules((prev) => ({ ...prev, [mod.id]: !isExpanded }))
                    }
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submodules & Actions */}
              {isExpanded && (
                <div className="p-4 flex flex-col gap-4">
                  {mod.submodules.map((sub) => (
                    <div key={sub.id} className="flex flex-col gap-2">
                      <span className="text-xs font-black tracking-wider text-slate-400 uppercase">
                        {sub.label}
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {sub.actions.map((act) => {
                          const isChecked = selectedPermissions.includes(act.id);
                          return (
                            <label
                              key={act.id}
                              className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition select-none ${
                                isChecked
                                  ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950'
                                  : 'bg-white border-slate-200/80 hover:bg-slate-50/70 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(act.id)}
                                className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-xs leading-snug">{act.label}</span>
                                <span className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                                  {act.description}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Summary & Save Footer */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-1 border-t border-slate-200 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          <strong className="text-slate-900 font-extrabold">{selectedPermissions.length}</strong> of{' '}
          {allAvailableIds.length} permissions assigned
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onSave(selectedPermissions)}
            className="px-5 py-2 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white text-xs font-heading font-extrabold flex items-center gap-1.5 transition shadow"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Permissions'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

