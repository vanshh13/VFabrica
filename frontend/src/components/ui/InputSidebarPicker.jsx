import React from 'react';
import { Search, X, Check, ChevronRight, Filter } from 'lucide-react';

/**
 * Reusable Trigger Component for Input Sidebar Selection
 */
export function InputSidebarTrigger({
  label,
  required = false,
  badgeCount,
  selectedObj,
  selectedLabel,
  selectedSublabel,
  selectedIcon: SelectedIcon,
  placeholder = 'Click to filter & select...',
  onClick,
  onClear,
  className = ''
}) {
  const displayLabel = selectedLabel || (selectedObj ? (selectedObj.name || selectedObj.title || selectedObj.company_name) : null);
  const displaySub = selectedSublabel || (selectedObj ? (selectedObj.description || selectedObj.sku || selectedObj.city) : null);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium theme-text-main mb-1.5 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {badgeCount !== undefined && badgeCount !== null && (
            <span className="text-xs theme-text-subtle font-normal">
              {badgeCount} available
            </span>
          )}
        </label>
      )}
      <button
        type="button"
        onClick={onClick}
        className={`w-full p-3 text-left bg-[var(--bg)] border rounded-xl flex items-center justify-between transition-all group cursor-pointer ${
          displayLabel
            ? 'border-[var(--primary)]/50 bg-[var(--primary)]/5 ring-1 ring-[var(--primary)]/30'
            : 'theme-border-color hover:border-[var(--primary)]/50'
        }`}
      >
        {displayLabel ? (
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold flex-shrink-0">
              {SelectedIcon ? <SelectedIcon className="w-4.5 h-4.5" /> : <Filter className="w-4.5 h-4.5" />}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm theme-text-main truncate block">{displayLabel}</span>
              {displaySub && (
                <p className="text-xs theme-text-subtle truncate mt-0.5">{displaySub}</p>
              )}
            </div>
          </div>
        ) : (
          <span className="text-sm theme-text-subtle flex items-center gap-2 py-0.5">
            <Search className="w-4 h-4 text-gray-400" />
            {placeholder}
          </span>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          {displayLabel && onClear && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1 theme-text-subtle hover:theme-text-main rounded-md hover:bg-[var(--bg-elevated)]"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <div className="flex items-center gap-1 text-xs text-[var(--primary)] font-semibold">
            <span>{displayLabel ? 'Change' : 'Select'}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </button>
    </div>
  );
}

/**
 * Reusable Input Sidebar Drawer Component for filtering and selecting items
 */
export function InputSidebarPicker({
  isOpen,
  onClose,
  title = 'Select Item',
  subtitle = 'Search and filter options',
  icon: DrawerIcon = Filter,
  searchPlaceholder = 'Search by keyword...',
  items = [],
  selectedId,
  onSelect,
  getKey = (item) => item?.id || item?.key,
  getSearchableString = (item) => [
    item?.name,
    item?.title,
    item?.description,
    item?.sku,
    item?.brand,
    item?.city,
    item?.company_name
  ].filter(Boolean).join(' '),
  renderItem,
  emptyMessage = 'No matching items found',
  showAllOption = false,
  allOptionLabel = 'All Items'
}) {
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const str = getSearchableString(item);
    return String(str).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex justify-end transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-[var(--bg-elevated)] border-l theme-border-color shadow-2xl flex flex-col transition-transform transform animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b theme-border-color flex items-center justify-between bg-[var(--bg)]">
          <div className="flex items-center gap-3">
            <div className="w-9.5 h-9.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <DrawerIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base theme-text-main">{title}</h3>
              <p className="text-xs theme-text-subtle">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 theme-text-subtle hover:theme-text-main hover:bg-[var(--bg-elevated)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b theme-border-color bg-[var(--bg-elevated)]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 theme-text-subtle" />
            <input
              type="text"
              autoFocus
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-[var(--bg)] border theme-border-color theme-text-main rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 theme-text-subtle hover:theme-text-main"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {showAllOption && (
            <div
              onClick={() => {
                onSelect(null);
                onClose();
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                !selectedId
                  ? 'bg-[var(--primary)]/10 border-[var(--primary)] theme-text-main shadow-sm font-semibold'
                  : 'bg-[var(--bg)] border-transparent hover:border-[var(--primary)]/30 hover:bg-[var(--bg-elevated)] theme-text-main'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                  !selectedId ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-elevated)] theme-text-subtle'
                }`}>
                  <Filter className="w-4 h-4" />
                </div>
                <span className="text-sm">{allOptionLabel}</span>
              </div>
              {!selectedId && <Check className="w-5 h-5 text-[var(--primary)]" />}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-sm theme-text-subtle">
              {emptyMessage} {search ? `matching "${search}"` : ''}
            </div>
          ) : (
            filteredItems.map((item) => {
              const itemId = getKey(item);
              const isSelected = String(itemId) === String(selectedId);

              if (renderItem) {
                return (
                  <div
                    key={itemId}
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="cursor-pointer"
                  >
                    {renderItem(item, isSelected)}
                  </div>
                );
              }

              return (
                <div
                  key={itemId}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[var(--primary)]/10 border-[var(--primary)] theme-text-main shadow-sm'
                      : 'bg-[var(--bg)] border-transparent hover:border-[var(--primary)]/30 hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                        isSelected
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--bg-elevated)] theme-text-subtle'
                      }`}
                    >
                      <DrawerIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-sm theme-text-main truncate block">
                        {item.name || item.title || item.company_name}
                      </span>
                      {item.description && (
                        <p className="text-xs theme-text-subtle truncate mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
