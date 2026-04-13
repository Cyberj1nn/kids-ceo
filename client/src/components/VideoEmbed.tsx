import './VideoEmbed.css';

interface VideoEmbedProps {
  url: string;
}

function extractRutubeId(url: string): string | null {
  // https://rutube.ru/video/XXXX/ или https://rutube.ru/play/embed/XXXX
  const match = url.match(/rutube\.ru\/(?:video|play\/embed)\/([a-f0-9]+)/i);
  return match ? match[1] : null;
}

export default function VideoEmbed({ url }: VideoEmbedProps) {
  const rutubeId = extractRutubeId(url);

  if (rutubeId) {
    return (
      <div className="video-embed">
        <iframe
          src={`https://rutube.ru/play/embed/${rutubeId}`}
          frameBorder="0"
          allow="clipboard-write; autoplay"
          allowFullScreen
          title="Видео"
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="video-embed-fallback"
        >
          Открыть видео на Rutube
        </a>
      </div>
    );
  }

  // Фоллбэк — просто ссылка
  return (
    <div className="video-embed video-embed--link">
      <a href={url} target="_blank" rel="noopener noreferrer">
        🎬 Открыть видео
      </a>
    </div>
  );
}
