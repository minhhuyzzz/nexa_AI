'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Loader2,
  Clock,
  Sparkles,
  TrendingUp,
  BookOpen,
  Award,
  Users,
  Building2,
  CornerDownLeft,
} from 'lucide-react';
import type { SearchResultItem, PopularTagItem } from '@/app/api/search/route';

interface GlobalSearchInputProps {
  scope?: 'personal' | 'org' | 'admin';
  orgSlug?: string;
  placeholder?: string;
  className?: string;
}

const RECENT_SEARCHES_KEY = 'nexa_recent_searches';
const MAX_RECENT_SEARCHES = 4;

export function GlobalSearchInput({
  scope = 'personal',
  orgSlug,
  placeholder,
  className = '',
}: GlobalSearchInputProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [popularTags, setPopularTags] = useState<PopularTagItem[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isMac, setIsMac] = useState(false);

  // Default placeholder based on scope
  const defaultPlaceholder =
    placeholder ||
    (scope === 'admin'
      ? 'Tìm người dùng, tổ chức, đề chuẩn...'
      : scope === 'org'
      ? 'Tìm học viên, lớp học, đợt khảo thí...'
      : 'Tìm kiếm đề khảo thí, bài thi...');

  // Detect platform for shortcut badge (⌘K vs Ctrl+K)
  useEffect(() => {
    setIsMac(typeof navigator !== 'undefined' && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentQueries(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveRecentQuery = useCallback((q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    try {
      setRecentQueries((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Ignore
    }
  }, []);

  const clearRecentQueries = useCallback(() => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentQueries([]);
    } catch {
      // Ignore
    }
  }, []);

  // Global shortcut (Ctrl+K or ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch results or suggestions
  const fetchSearchResults = useCallback(
    async (searchTerm: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          scope,
          q: searchTerm.trim(),
        });
        if (orgSlug) {
          params.set('orgSlug', orgSlug);
        }

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            if (Array.isArray(data.results)) {
              setResults(data.results);
              setActiveIndex(-1);
            }
            if (Array.isArray(data.popularTags)) {
              setPopularTags(data.popularTags);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch search results:', err);
      } finally {
        setLoading(false);
      }
    },
    [scope, orgSlug]
  );

  // Debounced search query
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchSearchResults(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen, fetchSearchResults]);

  // Handle keyboard navigation inside dropdown
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        const selected = results[activeIndex];
        handleSelectResult(selected);
      } else if (results.length > 0) {
        handleSelectResult(results[0]);
      }
    }
  };

  const handleSelectResult = (item: SearchResultItem) => {
    if (query.trim()) {
      saveRecentQuery(query);
    }
    setIsOpen(false);
    router.push(item.href);
  };

  const handleRecentClick = (text: string) => {
    setQuery(text);
    inputRef.current?.focus();
  };

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assessment':
        return <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />;
      case 'learning_station':
        return <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'class':
        return <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      case 'organization':
        return <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'member':
      case 'user':
        return <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search
          className="w-4 h-4 text-slate-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          strokeWidth={1.75}
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsOpen(true);
            if (results.length === 0) {
              fetchSearchResults(query);
            }
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={defaultPlaceholder}
          className="w-full bg-slate-50/90 dark:bg-zinc-900/90 hover:bg-slate-100 dark:hover:bg-zinc-850 focus:bg-white dark:focus:bg-[#111114] text-xs text-neutral-900 dark:text-neutral-100 pl-9 pr-16 py-2 rounded-xl border border-slate-200/80 dark:border-zinc-800 focus:border-blue-600 dark:focus:border-blue-400 focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-neutral-500 shadow-2xs truncate"
          aria-label="Thanh tìm kiếm toàn hệ thống"
        />

        {/* Right side actions inside input: Clear or Loader + Shortcut badge */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 pointer-events-auto transition-colors cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-800 rounded-md border border-slate-200 dark:border-zinc-700 shadow-2xs">
              {isMac ? '⌘' : 'Ctrl'} K
            </kbd>
          )}
        </div>
      </div>

      {/* Instant Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 w-full bg-white dark:bg-[#111114] border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden text-xs animate-menu max-h-[75vh] flex flex-col font-sans">
          <div className="overflow-y-auto p-3 space-y-4">
            {/* 1. Recent Searches (If any and no query) */}
            {!query && recentQueries.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" strokeWidth={1.75} />
                    <span>Tìm kiếm gần đây</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearRecentQueries();
                    }}
                    className="hover:text-red-500 text-slate-400 dark:text-zinc-500 transition-colors text-[10px] cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 px-1">
                  {recentQueries.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleRecentClick(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 transition-colors text-xs cursor-pointer"
                    >
                      <Clock className="w-2.5 h-2.5 opacity-50" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. No query: Scope-specific quick access / trending */}
            {!query ? (
              scope === 'personal' ? (
                /* PERSONAL: Trending Searches (Admin Bank) & Popular Tags */
                <>
                  {/* Trending Searches */}
                  {results.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                        Trending Searches
                      </div>

                      <div className="space-y-0.5">
                        {results.map((item, idx) => {
                          const isSelected = activeIndex === idx;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectResult(item)}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={`group px-2.5 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-slate-100 dark:bg-zinc-850 text-blue-600 dark:text-blue-400'
                                  : 'hover:bg-slate-50 dark:hover:bg-zinc-850/60 text-neutral-800 dark:text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <TrendingUp
                                  className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0"
                                  strokeWidth={1.75}
                                />
                                <span className="font-normal text-xs sm:text-[13px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {item.title}
                                </span>
                              </div>

                              <CornerDownLeft
                                className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                                  isSelected ? 'opacity-100 text-blue-600 dark:text-blue-400' : 'opacity-0'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Popular Tags */}
                  {popularTags.length > 0 && (
                    <div className="space-y-2">
                      <div className="px-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                        Popular Tags
                      </div>

                      <div className="flex flex-wrap gap-2 px-1">
                        {popularTags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleRecentClick(tag.name)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-normal transition-colors cursor-pointer"
                          >
                            <span>{tag.name}</span>
                            {typeof tag.count === 'number' && (
                              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                                {tag.count.toLocaleString()}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!loading && results.length === 0 && popularTags.length === 0 && recentQueries.length === 0 && (
                    <div className="py-6 text-center text-slate-400 dark:text-zinc-500">
                      <p className="text-xs">Chưa có đề khảo thí thịnh hành</p>
                      <p className="text-[11px] mt-1 text-slate-400">
                        Gõ từ khóa để bắt đầu tìm kiếm đề thi...
                      </p>
                    </div>
                  )}
                </>
              ) : (
                /* ORG & ADMIN: Quick Access (Classes, Campaigns, Users, Orgs) */
                <>
                  {results.length > 0 ? (
                    <div className="space-y-1">
                      <div className="px-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                        Truy cập nhanh
                      </div>

                      <div className="space-y-0.5">
                        {results.map((item, idx) => {
                          const isSelected = activeIndex === idx;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectResult(item)}
                              onMouseEnter={() => setActiveIndex(idx)}
                              className={`group px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                  : 'hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {getCategoryIcon(item.category)}
                                <div className="min-w-0">
                                  <div className="font-medium text-xs truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {item.title}
                                  </div>
                                  {item.subtitle && (
                                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                                      {item.subtitle}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {item.badge && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700">
                                    {item.badge}
                                  </span>
                                )}
                                <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 hidden sm:inline">
                                  {item.categoryLabel}
                                </span>
                                <CornerDownLeft
                                  className={`w-3 h-3 transition-opacity ${
                                    isSelected ? 'opacity-100 text-blue-600 dark:text-blue-400' : 'opacity-0'
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : !loading && recentQueries.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 dark:text-zinc-500">
                      <p className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                        {scope === 'org' ? 'Tra cứu thông tin tổ chức' : 'Quản trị hệ thống NEXA'}
                      </p>
                      <p className="text-[11px] mt-1 text-slate-400">
                        {scope === 'org'
                          ? 'Nhập tên học viên, email, mã lớp hoặc tên đợt khảo thí...'
                          : 'Nhập tên tổ chức, email người dùng hoặc mã đề chuẩn...'}
                      </p>
                    </div>
                  ) : null}
                </>
              )
            ) : (
              /* 3. With query: Active search results */
              <div className="space-y-1">
                <div className="px-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Kết quả tìm kiếm cho &quot;{query}&quot;</span>
                </div>

                {results.length > 0 ? (
                  <div className="space-y-0.5">
                    {results.map((item, idx) => {
                      const isSelected = activeIndex === idx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectResult(item)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`group px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                              : 'hover:bg-slate-50 dark:hover:bg-zinc-850 text-neutral-800 dark:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {getCategoryIcon(item.category)}
                            <div className="min-w-0">
                              <div className="font-medium text-xs truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {item.title}
                              </div>
                              {item.subtitle && (
                                <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                                  {item.subtitle}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700">
                                {item.badge}
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 hidden sm:inline">
                              {item.categoryLabel}
                            </span>
                            <CornerDownLeft
                              className={`w-3 h-3 transition-opacity ${
                                isSelected ? 'opacity-100 text-blue-600 dark:text-blue-400' : 'opacity-0'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : !loading ? (
                  <div className="py-6 text-center text-slate-400 dark:text-zinc-500">
                    <p>
                      {scope === 'org'
                        ? `Không tìm thấy học viên, lớp học hoặc đợt khảo thí nào phù hợp với "${query}"`
                        : scope === 'admin'
                        ? `Không tìm thấy người dùng, tổ chức hoặc đề chuẩn nào phù hợp với "${query}"`
                        : `Không tìm thấy kết quả nào phù hợp với "${query}"`}
                    </p>
                    <p className="text-[11px] mt-1 text-slate-400">
                      {scope === 'org'
                        ? 'Thử tìm kiếm với họ tên, email, mã lớp hoặc tên đợt khảo thí khác...'
                        : scope === 'admin'
                        ? 'Thử tìm kiếm với email, tên tổ chức hoặc mã đề chuẩn khác...'
                        : 'Thử tìm kiếm với tên đề thi, mã bài thi hoặc từ khóa khác...'}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
