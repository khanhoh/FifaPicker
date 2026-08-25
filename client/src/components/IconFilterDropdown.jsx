import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function IconFilterDropdown({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  loading = false,
  grouped = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());
    if (!normalizedQuery) return options;
    return options.filter((option) => (
      normalizeSearchText(`${option.label} ${option.group || ''}`).includes(normalizedQuery)
    ));
  }, [options, query]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [isOpen]);

  const selectValue = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex w-full items-center gap-2 rounded-full border bg-[#101728] px-3 py-1.5 text-left text-xs font-semibold shadow-inner transition focus:outline-none focus:ring-1 focus:ring-emerald-400/40 ${
          isOpen ? 'border-emerald-400/80' : 'border-slate-700/80 hover:border-slate-600'
        }`}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-950/70">
          {selectedOption?.iconUrl ? (
            <img src={selectedOption.iconUrl} alt="" className="h-6 w-6 object-contain" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-slate-600" />
          )}
        </span>
        <span className={`min-w-0 flex-1 truncate ${selectedOption ? 'text-slate-100' : 'text-slate-400'}`}>
          {loading ? 'Đang tải...' : selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-[80] mt-1.5 overflow-hidden rounded-xl border border-slate-700 bg-[#0b1220] shadow-2xl shadow-black/70">
          <div className="border-b border-slate-800 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-2 pl-8 pr-2 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-400/70 focus:outline-none"
              />
            </div>
          </div>

          <div role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {!query && (
              <button
                type="button"
                onClick={() => selectValue('')}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition ${
                  !value ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                </span>
                <span className="flex-1 font-semibold">{placeholder}</span>
                {!value && <Check className="h-4 w-4" />}
              </button>
            )}

            {filteredOptions.map((option, index) => {
              const showGroup = grouped && option.group && option.group !== filteredOptions[index - 1]?.group;
              const selected = option.value === value;
              return (
                <React.Fragment key={option.value}>
                  {showGroup && (
                    <div className="px-2 pb-1 pt-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {option.group}
                    </div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => selectValue(option.value)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${
                      selected ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950/80">
                      <img src={option.iconUrl} alt="" className="h-7 w-7 object-contain" loading="lazy" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold">{option.label}</span>
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                </React.Fragment>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="px-3 py-5 text-center text-xs text-slate-500">Không có kết quả phù hợp</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
