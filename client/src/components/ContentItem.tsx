import type { ContentDetail } from '../api/content';
import VideoEmbed from './VideoEmbed';
import './ContentItem.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

interface ContentItemProps {
  content: ContentDetail;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ContentItem({ content, onBack, onEdit, onDelete }: ContentItemProps) {
  const images = content.attachments.filter((a) => a.fileType === 'image');
  const pdfs = content.attachments.filter((a) => a.fileType === 'pdf');
  const audios = content.attachments.filter((a) => a.fileType === 'audio');

  return (
    <article className="content-item">
      <div className="content-item-topbar">
        <button className="content-item-back" onClick={onBack}>
          ← Назад
        </button>
        {(onEdit || onDelete) && (
          <div className="content-item-actions">
            {onEdit && (
              <button className="content-item-action-btn" onClick={onEdit}>
                Редактировать
              </button>
            )}
            {onDelete && (
              <button className="content-item-action-btn content-item-action-btn--danger" onClick={onDelete}>
                Удалить
              </button>
            )}
          </div>
        )}
      </div>

      <h1 className="content-item-title">{content.title}</h1>

      <div className="content-item-meta">
        <span>{content.authorName}</span>
        <span>·</span>
        <span>{new Date(content.createdAt).toLocaleDateString('ru-RU')}</span>
      </div>

      {content.videoUrl && <VideoEmbed url={content.videoUrl} />}

      {content.body && (
        <div
          className="content-item-body"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
      )}

      {images.length > 0 && (
        <div className="content-item-images">
          {images.map((img) => (
            <a key={img.id} href={`${API_BASE}${img.fileUrl}`} target="_blank" rel="noopener noreferrer">
              <img src={`${API_BASE}${img.fileUrl}`} alt={img.originalName} />
            </a>
          ))}
        </div>
      )}

      {pdfs.length > 0 && (
        <div className="content-item-files">
          <h3>Документы</h3>
          {pdfs.map((pdf) => (
            <a
              key={pdf.id}
              href={`${API_BASE}${pdf.fileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="content-item-file"
            >
              📄 {pdf.originalName}
              <span className="content-item-file-size">
                {(pdf.fileSize / 1024 / 1024).toFixed(1)} МБ
              </span>
            </a>
          ))}
        </div>
      )}

      {audios.length > 0 && (
        <div className="content-item-audios">
          <h3>Аудио</h3>
          {audios.map((audio) => (
            <div key={audio.id} className="content-item-audio">
              <span>🎧 {audio.originalName}</span>
              <audio controls src={`${API_BASE}${audio.fileUrl}`} />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
