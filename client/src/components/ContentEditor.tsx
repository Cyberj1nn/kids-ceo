import { useState, useRef } from 'react';
import RichTextEditor from './RichTextEditor';
import VideoEmbed from './VideoEmbed';
import {
  createContent,
  updateContent,
  uploadFile,
  type ContentDetail,
  type ContentBlock,
  type BlockType,
  type Category,
} from '../api/content';
import './ContentEditor.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const BLOCK_LABELS: Record<BlockType, string> = {
  text: 'Текст',
  video: 'Видео',
  image: 'Изображение',
  file: 'Файл',
  audio: 'Аудио',
};

interface EditorBlock {
  id: string;
  type: BlockType;
  content: string;        // HTML (text) или URL (video)
  fileUrl?: string;       // после загрузки файла
  originalName?: string;
  fileSize?: number;
  fileType?: string;
  uploading?: boolean;
  uploadError?: string;
}

interface ContentEditorProps {
  tabId: number;
  categoryId?: number | null;
  categories?: Category[];
  editItem?: ContentDetail | null;
  onSaved: () => void;
  onCancel: () => void;
}

function genId() {
  return crypto.randomUUID();
}

function initBlocks(editItem?: ContentDetail | null): EditorBlock[] {
  if (!editItem) return [];

  // Новый формат — блоки
  if (editItem.blocks && editItem.blocks.length > 0) {
    return editItem.blocks.map((b) => ({
      id: b.id || genId(),
      type: b.type,
      content: b.content ?? b.url ?? '',
      fileUrl: b.fileUrl,
      originalName: b.originalName,
      fileSize: b.fileSize,
      fileType: b.fileType,
    }));
  }

  // Старый формат — конвертируем в блоки
  const blocks: EditorBlock[] = [];
  if (editItem.videoUrl) {
    blocks.push({ id: genId(), type: 'video', content: editItem.videoUrl });
  }
  if (editItem.body?.trim()) {
    blocks.push({ id: genId(), type: 'text', content: editItem.body });
  }
  return blocks;
}

export default function ContentEditor({
  tabId,
  categoryId,
  categories = [],
  editItem,
  onSaved,
  onCancel,
}: ContentEditorProps) {
  const [title, setTitle] = useState(editItem?.title || '');
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => initBlocks(editItem));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    editItem?.categoryId ?? categoryId ?? null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingBlockIndexRef = useRef<number>(-1);

  const isEdit = !!editItem;

  const addBlock = (type: BlockType) => {
    setBlocks((prev) => [...prev, { id: genId(), type, content: '' }]);
    setShowAddMenu(false);
  };

  const updateBlock = (index: number, patch: Partial<EditorBlock>) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const removeBlock = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setBlocks((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleFilePick = (index: number) => {
    pendingBlockIndexRef.current = index;
    if (fileInputRef.current) {
      const type = blocks[index].type;
      if (type === 'image') {
        fileInputRef.current.accept = 'image/*';
      } else if (type === 'audio') {
        fileInputRef.current.accept = 'audio/*';
      } else {
        fileInputRef.current.accept = 'application/pdf';
      }
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const index = pendingBlockIndexRef.current;
    if (!file || index < 0) return;

    updateBlock(index, { uploading: true, uploadError: undefined });
    try {
      const result = await uploadFile(file);
      updateBlock(index, {
        uploading: false,
        fileUrl: result.fileUrl,
        originalName: result.originalName,
        fileSize: result.fileSize,
        fileType: result.fileType,
      });
    } catch {
      updateBlock(index, { uploading: false, uploadError: 'Ошибка загрузки файла' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите заголовок');
      return;
    }
    if (blocks.some((b) => b.uploading)) {
      setError('Дождитесь завершения загрузки файлов');
      return;
    }

    const contentBlocks: ContentBlock[] = blocks
      .filter((b) => {
        if (b.type === 'text') return b.content.replace(/<[^>]+>/g, '').trim().length > 0;
        if (b.type === 'video') return b.content.trim().length > 0;
        return !!b.fileUrl;
      })
      .map((b) => {
        const block: ContentBlock = { id: b.id, type: b.type };
        if (b.type === 'text') block.content = b.content;
        if (b.type === 'video') block.url = b.content;
        if (b.type === 'image' || b.type === 'file' || b.type === 'audio') {
          block.fileUrl = b.fileUrl;
          block.originalName = b.originalName;
          block.fileSize = b.fileSize;
          block.fileType = b.fileType;
        }
        return block;
      });

    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await updateContent(editItem.id, {
          title: title.trim(),
          blocks: contentBlocks,
          categoryId: selectedCategoryId,
        });
      } else {
        await createContent({
          title: title.trim(),
          blocks: contentBlocks,
          tabId,
          categoryId: selectedCategoryId ?? undefined,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions: { id: number; label: string }[] = [];
  const parents = categories.filter((c) => c.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder);
  for (const parent of parents) {
    categoryOptions.push({ id: parent.id, label: parent.name });
    const children = categories
      .filter((c) => c.parentId === parent.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const child of children) {
      categoryOptions.push({ id: child.id, label: `    — ${child.name}` });
    }
  }

  return (
    <div className="content-editor">
      <div className="content-editor-header">
        <h2>{isEdit ? 'Редактировать материал' : 'Новый материал'}</h2>
        <button className="content-editor-cancel" onClick={onCancel}>
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="content-editor-error">{error}</div>}

        <div className="content-editor-field">
          <label>Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите заголовок материала"
            autoFocus
          />
        </div>

        {categoryOptions.length > 0 && (
          <div className="content-editor-field">
            <label>Категория</label>
            <select
              value={selectedCategoryId ?? ''}
              onChange={(e) =>
                setSelectedCategoryId(e.target.value === '' ? null : Number(e.target.value))
              }
            >
              <option value="">— Без категории —</option>
              {categoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="block-list">
          {blocks.length === 0 && (
            <div className="block-list-empty">
              Нет блоков. Нажмите «+ Добавить блок» ниже.
            </div>
          )}

          {blocks.map((block, index) => (
            <div key={block.id} className="block-item">
              <div className="block-controls">
                <span className="block-type-label">{BLOCK_LABELS[block.type]}</span>
                <div className="block-control-btns">
                  <button
                    type="button"
                    className="block-btn"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    title="Переместить вверх"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="block-btn"
                    onClick={() => moveDown(index)}
                    disabled={index === blocks.length - 1}
                    title="Переместить вниз"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="block-btn block-btn--danger"
                    onClick={() => removeBlock(index)}
                    title="Удалить блок"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="block-content">
                {block.type === 'text' && (
                  <RichTextEditor
                    content={block.content}
                    onChange={(html) => updateBlock(index, { content: html })}
                  />
                )}

                {block.type === 'video' && (
                  <div className="block-video">
                    <input
                      type="url"
                      value={block.content}
                      onChange={(e) => updateBlock(index, { content: e.target.value })}
                      placeholder="https://rutube.ru/video/..."
                      className="block-url-input"
                    />
                    {block.content.trim() && (
                      <div className="block-video-preview">
                        <VideoEmbed url={block.content} />
                      </div>
                    )}
                  </div>
                )}

                {(block.type === 'image' || block.type === 'file' || block.type === 'audio') && (
                  <div className="block-file">
                    {block.uploading && (
                      <div className="block-uploading">Загрузка файла...</div>
                    )}
                    {block.uploadError && (
                      <div className="block-upload-error">{block.uploadError}</div>
                    )}
                    {block.fileUrl && !block.uploading && block.type === 'image' && (
                      <div className="block-image-preview">
                        <img
                          src={`${API_BASE}${block.fileUrl}`}
                          alt={block.originalName}
                        />
                        <span className="block-image-name">{block.originalName}</span>
                      </div>
                    )}
                    {block.fileUrl && !block.uploading && block.type === 'file' && (
                      <div className="block-file-info">
                        <span>📄 {block.originalName}</span>
                        {block.fileSize && (
                          <span className="block-file-size">
                            {(block.fileSize / 1024 / 1024).toFixed(1)} МБ
                          </span>
                        )}
                      </div>
                    )}
                    {block.fileUrl && !block.uploading && block.type === 'audio' && (
                      <div className="block-audio-preview">
                        <div className="block-file-info">
                          <span>🎧 {block.originalName}</span>
                          {block.fileSize && (
                            <span className="block-file-size">
                              {(block.fileSize / 1024 / 1024).toFixed(1)} МБ
                            </span>
                          )}
                        </div>
                        <audio controls src={`${API_BASE}${block.fileUrl}`} />
                      </div>
                    )}
                    <button
                      type="button"
                      className="block-upload-btn"
                      onClick={() => handleFilePick(index)}
                      disabled={block.uploading}
                    >
                      {block.fileUrl
                        ? 'Заменить файл'
                        : block.type === 'image'
                        ? 'Выбрать изображение'
                        : block.type === 'audio'
                        ? 'Выбрать аудио (MP3, WAV, OGG, M4A)'
                        : 'Выбрать файл (PDF)'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="block-add-section">
          {showAddMenu ? (
            <div className="block-add-menu">
              <button
                type="button"
                className="block-add-option"
                onClick={() => addBlock('text')}
              >
                Текст
              </button>
              <button
                type="button"
                className="block-add-option"
                onClick={() => addBlock('video')}
              >
                Видео (Rutube)
              </button>
              <button
                type="button"
                className="block-add-option"
                onClick={() => addBlock('image')}
              >
                Изображение
              </button>
              <button
                type="button"
                className="block-add-option"
                onClick={() => addBlock('file')}
              >
                Файл (PDF)
              </button>
              <button
                type="button"
                className="block-add-option"
                onClick={() => addBlock('audio')}
              >
                Аудио
              </button>
              <button
                type="button"
                className="block-add-option block-add-cancel"
                onClick={() => setShowAddMenu(false)}
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="block-add-btn"
              onClick={() => setShowAddMenu(true)}
            >
              + Добавить блок
            </button>
          )}
        </div>

        <div className="content-editor-actions">
          <button
            type="button"
            className="content-editor-btn-secondary"
            onClick={onCancel}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="content-editor-btn-primary"
            disabled={saving}
          >
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}
