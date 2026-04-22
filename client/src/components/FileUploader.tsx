import { useState, useRef, type DragEvent } from 'react';
import { uploadFile, deleteAttachment, type Attachment } from '../api/content';
import './FileUploader.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

interface FileUploaderProps {
  contentItemId?: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export default function FileUploader({ contentItemId, attachments, onAttachmentsChange }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      try {
        const result = await uploadFile(file, contentItemId);
        if (result.id) {
          newAttachments.push(result as Attachment);
        }
      } catch (err: any) {
        alert(err.response?.data?.error || 'Ошибка загрузки файла');
      }
    }
    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments]);
    }
    setUploading(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAttachment(id);
      onAttachmentsChange(attachments.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  return (
    <div className="file-uploader">
      <div
        className={`file-uploader-drop ${isDragging ? 'file-uploader-drop--active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,audio/*,.epub,.fb2,.mobi,.azw,.azw3,.rtf,.doc,.docx,.txt"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          hidden
        />
        {uploading ? (
          <span>Загрузка...</span>
        ) : (
          <span>Перетащите файлы сюда или нажмите для выбора</span>
        )}
        <span className="file-uploader-hint">Изображения до 10 МБ, PDF до 50 МБ, аудио до 100 МБ, электронные книги (EPUB, FB2, MOBI, RTF, DOC, DOCX, TXT) до 50 МБ</span>
      </div>

      {attachments.length > 0 && (
        <div className="file-uploader-list">
          {attachments.map((att) => (
            <div key={att.id} className="file-uploader-item">
              {att.fileType === 'image' ? (
                <img src={`${API_BASE}${att.fileUrl}`} alt={att.originalName} className="file-uploader-thumb" />
              ) : (
                <span className="file-uploader-icon">
                  {att.fileType === 'pdf'
                    ? '📄'
                    : att.fileType === 'audio'
                    ? '🎧'
                    : att.fileType === 'ebook'
                    ? '📚'
                    : '📎'}
                </span>
              )}
              <span className="file-uploader-name">{att.originalName}</span>
              <span className="file-uploader-size">
                {(att.fileSize / 1024 / 1024).toFixed(1)} МБ
              </span>
              <button
                className="file-uploader-remove"
                onClick={() => handleDelete(att.id)}
                title="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
