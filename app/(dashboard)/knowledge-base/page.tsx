'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  Plus,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  File,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { cn, formatDate, formatFileSize } from '@/lib/utils';
import type { KnowledgeBase, KnowledgeSourceType, Bot } from '@/types';

// ─── Types ────────────────────────────────────────────────────

interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

const SOURCE_TYPE_LABELS: Record<KnowledgeSourceType, string> = {
  manual: 'Manual',
  file: 'File',
  url: 'URL',
  faq: 'FAQ',
  pdf: 'PDF',
  product: 'Product',
};

const SOURCE_TYPE_COLORS: Record<
  KnowledgeSourceType,
  'default' | 'info' | 'success' | 'warning' | 'purple' | 'secondary'
> = {
  manual: 'default',
  file: 'info',
  url: 'warning',
  faq: 'success',
  pdf: 'danger' as 'default',
  product: 'purple',
};

// ─── Skeleton ─────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-lg bg-gray-800/50 animate-pulse"
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  // Bot selector
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [botsLoading, setBotsLoading] = useState(true);

  // Knowledge items
  const [items, setItems] = useState<KnowledgeBase[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Upload queue
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  // Manual form
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formSourceType, setFormSourceType] = useState<KnowledgeSourceType>('manual');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch bots ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/bots');
        if (!res.ok) throw new Error('Failed to fetch bots');
        const json = await res.json();
        const botList: Bot[] = json.bots ?? [];
        setBots(botList);
        if (botList.length > 0) setSelectedBotId(botList[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setBotsLoading(false);
      }
    })();
  }, []);

  // ── Fetch knowledge items ──────────────────────────────────
  const fetchItems = useCallback(async (botId: string) => {
    if (!botId) return;
    setItemsLoading(true);
    try {
      const res = await fetch(`/api/knowledge?botId=${encodeURIComponent(botId)}`);
      if (!res.ok) throw new Error('Failed to fetch knowledge items');
      const json = await res.json();
      setItems(json.items ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBotId) fetchItems(selectedBotId);
  }, [selectedBotId, fetchItems]);

  // ── File drop handler ──────────────────────────────────────
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!selectedBotId) return;

      const newUploads: UploadItem[] = acceptedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: 'pending' as const,
        progress: 0,
      }));

      setUploads((prev) => [...prev, ...newUploads]);

      // Upload each file
      newUploads.forEach(async (uploadItem) => {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadItem.id ? { ...u, status: 'uploading', progress: 20 } : u
          )
        );

        try {
          const formData = new FormData();
          formData.append('file', uploadItem.file);
          formData.append('botId', selectedBotId);

          const res = await fetch('/api/knowledge/upload', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json.error ?? 'Upload failed');
          }

          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadItem.id ? { ...u, status: 'done', progress: 100 } : u
            )
          );

          // Refresh list
          fetchItems(selectedBotId);

          // Remove from queue after delay
          setTimeout(() => {
            setUploads((prev) => prev.filter((u) => u.id !== uploadItem.id));
          }, 3000);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed';
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadItem.id
                ? { ...u, status: 'error', progress: 0, error: message }
                : u
            )
          );
        }
      });
    },
    [selectedBotId, fetchItems]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 20 * 1024 * 1024, // 20 MB
    disabled: !selectedBotId,
  });

  // ── Manual form submit ─────────────────────────────────────
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBotId || !formTitle.trim() || !formContent.trim()) return;

    setFormSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: selectedBotId,
          title: formTitle.trim(),
          content: formContent.trim(),
          sourceType: formSourceType,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Failed to save knowledge item');
      }

      setFormTitle('');
      setFormContent('');
      setFormSourceType('manual');
      fetchItems(selectedBotId);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Delete item ────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // ──────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-indigo-400" />
            Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Upload files or add content manually to train your AI bots.
          </p>
        </div>
      </div>

      {/* Bot Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-300 shrink-0">Bot:</label>
        {botsLoading ? (
          <div className="h-10 w-48 rounded-lg bg-gray-800 animate-pulse" />
        ) : (
          <div className="relative">
            <select
              value={selectedBotId}
              onChange={(e) => setSelectedBotId(e.target.value)}
              className="h-10 appearance-none rounded-lg border border-gray-700 bg-gray-800 pl-3 pr-9 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              disabled={bots.length === 0}
            >
              {bots.length === 0 ? (
                <option value="">No bots found</option>
              ) : (
                bots.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* ── Upload Section ──────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">Upload Files</h2>
          <p className="text-xs text-gray-500">Supports PDF, TXT, and Markdown files up to 20 MB.</p>

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer',
              isDragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : selectedBotId
                ? 'border-gray-700 bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800/60'
                : 'border-gray-800 bg-gray-900 cursor-not-allowed opacity-50'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 mb-3">
              <Upload className="h-6 w-6 text-indigo-400" />
            </div>
            {isDragActive ? (
              <p className="text-sm font-medium text-indigo-300">Drop files here...</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-300">
                  Drag & drop files here
                </p>
                <p className="mt-1 text-xs text-gray-500">or click to browse</p>
              </>
            )}
          </div>

          {/* Upload queue */}
          {uploads.length > 0 && (
            <div className="space-y-2">
              {uploads.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2"
                >
                  <File className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-300 truncate">
                      {u.file.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {formatFileSize(u.file.size)}
                    </p>
                    {u.status === 'uploading' && (
                      <div className="mt-1 h-1 w-full rounded-full bg-gray-700">
                        <div
                          className="h-1 rounded-full bg-indigo-500 transition-all duration-300"
                          style={{ width: `${u.progress}%` }}
                        />
                      </div>
                    )}
                    {u.status === 'error' && (
                      <p className="text-[10px] text-red-400 mt-0.5">{u.error}</p>
                    )}
                  </div>
                  {u.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
                  )}
                  {u.status === 'done' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  {u.status === 'error' && (
                    <button
                      onClick={() =>
                        setUploads((prev) => prev.filter((x) => x.id !== u.id))
                      }
                    >
                      <X className="h-4 w-4 text-red-400 shrink-0" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Manual Input Section ─────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">Add Manually</h2>
          <p className="text-xs text-gray-500">Write content directly and save it to the knowledge base.</p>

          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Title
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Product FAQ"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Content
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={6}
                placeholder="Paste your content here..."
                className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Source Type
              </label>
              <div className="relative">
                <select
                  value={formSourceType}
                  onChange={(e) =>
                    setFormSourceType(e.target.value as KnowledgeSourceType)
                  }
                  className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 pl-3 pr-9 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="manual">Manual</option>
                  <option value="faq">FAQ</option>
                  <option value="product">Product</option>
                  <option value="url">URL</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <p className="text-xs text-red-400">{formError}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="gradient"
              loading={formSubmitting}
              disabled={!selectedBotId || formSubmitting}
              leftIcon={<Plus className="h-4 w-4" />}
              className="w-full"
            >
              Save to Knowledge Base
            </Button>
          </form>
        </div>
      </div>

      {/* ── Knowledge Items Table ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">
            Knowledge Items
            {!itemsLoading && items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({items.length})
              </span>
            )}
          </h2>
        </div>

        {itemsLoading ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No knowledge items yet"
            description="Upload files or add content manually above to build your bot's knowledge base."
            action={
              selectedBotId
                ? {
                    label: 'Add your first item',
                    onClick: () =>
                      document.querySelector('textarea')?.focus(),
                  }
                : undefined
            }
          />
        ) : (
          <div className="rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hidden sm:table-cell">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hidden md:table-cell">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-900">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 shrink-0 text-gray-500" />
                        <span className="text-sm font-medium text-gray-200 truncate max-w-[200px]">
                          {item.title}
                        </span>
                      </div>
                      <p className="mt-0.5 pl-6 text-xs text-gray-500 truncate max-w-[260px]">
                        {item.content.slice(0, 80)}
                        {item.content.length > 80 ? '...' : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge
                        variant={
                          (SOURCE_TYPE_COLORS[item.source_type] as
                            | 'default'
                            | 'info'
                            | 'success'
                            | 'warning'
                            | 'purple'
                            | 'secondary') ?? 'secondary'
                        }
                      >
                        {SOURCE_TYPE_LABELS[item.source_type] ?? item.source_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500">
                        {formatDate(item.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40"
                        aria-label="Delete item"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
