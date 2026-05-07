import './VideoEmbed.css';

interface VideoEmbedProps {
  url: string;
}

interface EmbedInfo {
  src: string;
  allow?: string;
  label: string;
}

function getEmbedInfo(rawUrl: string): EmbedInfo | null {
  const url = rawUrl.trim();

  // Rutube — https://rutube.ru/video/XXXX/ или https://rutube.ru/play/embed/XXXX
  const rutube = url.match(/rutube\.ru\/(?:video|play\/embed)\/([a-zA-Z0-9]+)/i);
  if (rutube) {
    return {
      src: `https://rutube.ru/play/embed/${rutube[1]}`,
      allow: 'clipboard-write; autoplay; fullscreen',
      label: 'Открыть на Rutube',
    };
  }

  // YouTube — youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID, youtube.com/embed/ID
  const youtube =
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)([a-zA-Z0-9_-]{6,})/);
  if (youtube) {
    return {
      src: `https://www.youtube.com/embed/${youtube[1]}`,
      allow:
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
      label: 'Открыть на YouTube',
    };
  }

  // Vimeo — vimeo.com/123, player.vimeo.com/video/123
  const vimeo =
    url.match(/player\.vimeo\.com\/video\/(\d+)/) ||
    url.match(/vimeo\.com\/(?:channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d+)/);
  if (vimeo) {
    return {
      src: `https://player.vimeo.com/video/${vimeo[1]}`,
      allow: 'autoplay; fullscreen; picture-in-picture',
      label: 'Открыть на Vimeo',
    };
  }

  // VK Video — vk.com/video-OWNER_VIDEO или vk.com/video_ext.php?oid=...&id=...&hash=...
  const vkExt = url.match(/vk\.com\/video_ext\.php\?[^"'\s]+/i);
  if (vkExt) {
    return {
      src: vkExt[0].replace(/^http:/, 'https:').startsWith('http')
        ? vkExt[0]
        : `https://${vkExt[0]}`,
      allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
      label: 'Открыть VK Видео',
    };
  }
  const vk = url.match(/vk\.com\/(?:video|clip)(-?\d+)_(\d+)/i);
  if (vk) {
    return {
      src: `https://vk.com/video_ext.php?oid=${vk[1]}&id=${vk[2]}&hd=2`,
      allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
      label: 'Открыть VK Видео',
    };
  }

  // VK Видео отдельный домен — vkvideo.ru/video-OWNER_VIDEO
  const vkVideo = url.match(/vkvideo\.ru\/(?:video|clip)(-?\d+)_(\d+)/i);
  if (vkVideo) {
    return {
      src: `https://vk.com/video_ext.php?oid=${vkVideo[1]}&id=${vkVideo[2]}&hd=2`,
      allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
      label: 'Открыть VK Видео',
    };
  }

  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url.trim());
}

export default function VideoEmbed({ url }: VideoEmbedProps) {
  const embed = getEmbedInfo(url);

  if (embed) {
    return (
      <div className="video-embed">
        <iframe
          src={embed.src}
          frameBorder="0"
          allow={embed.allow}
          allowFullScreen
          title="Видео"
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="video-embed-fallback"
        >
          {embed.label}
        </a>
      </div>
    );
  }

  if (isDirectVideo(url)) {
    return (
      <div className="video-embed">
        <video controls preload="metadata" src={url.trim()} />
      </div>
    );
  }

  // Неизвестный провайдер — пробуем встроить как iframe; если домен запрещает,
  // браузер просто покажет пустой блок, поэтому добавляем явную ссылку под ним.
  return (
    <div className="video-embed">
      <iframe
        src={url}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Видео"
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="video-embed-fallback"
      >
        Открыть видео в новой вкладке
      </a>
    </div>
  );
}
