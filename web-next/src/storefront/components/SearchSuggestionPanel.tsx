import type { SearchSuggestion, SearchSuggestionGroup } from '../search/view';
import { useUiLocale } from '../i18n/ui-locale';

type SearchSuggestionPanelProps = {
  groups: SearchSuggestionGroup[];
  activeIndex: number;
  listboxId: string;
  onHover: (index: number) => void;
  onSelect: (suggestion: SearchSuggestion) => void;
  emptyLabel?: string;
  className?: string;
};

export function SearchSuggestionPanel({
  groups,
  activeIndex,
  listboxId,
  onHover,
  onSelect,
  emptyLabel,
  className,
}: SearchSuggestionPanelProps) {
  const { copy } = useUiLocale();
  const headingByKind = {
    designs: copy.search.designsHeading,
    vibes: copy.search.vibesHeading,
    occasions: copy.search.occasionsHeading,
  } as const;

  let itemIndex = -1;

  return (
    <div
      id={listboxId}
      role="listbox"
      aria-label={copy.nav.searchSuggestions}
      className={className ?? 'rounded-[1.25rem] border border-stone/70 bg-white/96 p-2 shadow-[0_18px_48px_-24px_rgba(26,26,26,0.28)] backdrop-blur-xl'}
    >
      {groups.length === 0 ? (
        <p className="px-3 py-4 font-body text-sm text-clay">{emptyLabel ?? copy.nav.noSuggestions}</p>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.kind}>
              <p className="px-3 py-2 font-label text-[10px] font-semibold uppercase tracking-[0.22em] text-label">
                {headingByKind[group.kind]}
              </p>
              <div className="space-y-1">
                {group.suggestions.map((suggestion) => {
                  const currentIndex = itemIndex + 1;
                  itemIndex = currentIndex;
                  const isActive = currentIndex === activeIndex;
                  return (
                    <button
                      key={suggestion.id}
                      id={`${listboxId}-${currentIndex}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => onHover(currentIndex)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onSelect(suggestion);
                      }}
                      className={`flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                        isActive ? 'bg-obsidian text-white' : 'bg-transparent text-obsidian hover:bg-papyrus'
                      }`}
                    >
                      <img
                        src={suggestion.imageSrc}
                        alt=""
                        width={56}
                        height={56}
                        className="h-14 w-14 shrink-0 rounded-[0.85rem] object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-body block truncate text-sm font-medium">{suggestion.label}</span>
                        <span className={`font-label mt-1 block text-[10px] uppercase tracking-[0.18em] ${isActive ? 'text-white/72' : 'text-label'}`}>
                          {suggestion.meta}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
