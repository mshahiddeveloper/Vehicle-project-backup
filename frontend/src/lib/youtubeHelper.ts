/**
 * Strict YouTube-only URL validator & clean looping embed generator.
 * Ensures:
 * - Only valid YouTube URLs (youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/..., youtube.com/embed/...) are accepted.
 * - Uses youtube-nocookie.com with loop=1 & playlist=<id> & rel=0 so the video loops cleanly without showing unrelated YouTube recommendations.
 */

export function extractYouTubeVideoId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        const v = url.searchParams.get('v') || '';
        return /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
      }
      const match = url.pathname.match(/^\/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function isValidYouTubeUrl(rawUrl: string | null | undefined): boolean {
  return extractYouTubeVideoId(rawUrl) !== null;
}

export function getYouTubeCleanLoopEmbedUrl(rawUrl: string | null | undefined): string | null {
  const videoId = extractYouTubeVideoId(rawUrl);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}&rel=0&modestbranding=1&playsinline=1&controls=1`;
}

