import { useState } from 'react';
import RichTextEditor from './RichTextEditor';
import FileUploader from './FileUploader';
import {
  createContent,
  updateContent,
  type ContentDetail,
  type Attachment,
} from '../api/content';
import './ContentEditor.css';

interface ContentEditorProps {
  tabId: number;
  categoryId?: number | null;
  editItem?: ContentDetail | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ContentEditor({ tabId, categoryId, editItem, onSaved, onCancel }: ContentEditorProps) {
  const [title, setTitle] = useState(editItem?.title || '');
  const [body, setBody] = useState(editItem?.body || '');
  const [videoUrl, setVideoUrl] = useState(editItem?.videoUrl || '');
  const [attachments, setAttachments] = useState<Attachment[]>(editItem?.attachments || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!editItem;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите заголовок');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEdit) {
        await updateContent(editItem.id, {
          title: title.trim(),
          body,
          videoUrl: videoUrl.trim() || undefined,
        });
      } else {
        await createContent({
          title: title.trim(),
          body,
          contentType: videoUrl.trim() ? 'video' : 'text',
          videoUrl: videoUrl.trim() || undefined,
          tabId,
          categoryId: categoryId || undefined,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-editor">
      <div className="content-editor-header">
        <h2>{isEdit ? 'Редактировать материал' : 'Новый материал'}</h2>
        <button className="content-editor-cancel" onClick={onCancel}>✕</button>
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

        <div className="content-editor-field">
          <label>Ссылка на видео (Rutube)</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://rutube.ru/video/..."
          />
        </div>

        <div className="content-editor-field">
          <label>Содержание</label>
          <RichTextEditor content={body} onChange={setBody} />
        </div>

        {isEdit && editItem && (
          <div className="content-editor-field">
            <label>Вложения</label>
            <FileUploader
              contentItemId={editItem.id}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </div>
        )}

        <div className="content-editor-actions">
          <button type="button" className="content-editor-btn-secondary" onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className="content-editor-btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  );
}
