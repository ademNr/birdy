/**
 * YouTube Search without API Key
 * Searches YouTube and extracts real video URLs from search results
 */

interface YouTubeVideoResult {
  videoId: string;
  videoUrl: string;
  title: string;
  description: string;
  thumbnail?: string;
  channelTitle?: string;
}

/**
 * Search YouTube and extract real video URLs from search results
 * Uses YouTube's public search page to find videos
 */
export async function searchYouTubeVideos(
  searchQuery: string,
  maxResults: number = 5
): Promise<YouTubeVideoResult[]> {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }

  try {
    // Use YouTube's search endpoint (no API key required for basic search)
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery.trim())}`;
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.error(`YouTube search error (${response.status}):`, response.statusText);
      return [];
    }

    const html = await response.text();
    
    // Extract video data from YouTube's initial data JSON
    // YouTube embeds initial data in a script tag
    const initialDataMatch = html.match(/var ytInitialData = ({.+?});/);
    if (initialDataMatch) {
      try {
        const initialData = JSON.parse(initialDataMatch[1]);
        const videos = extractVideosFromInitialData(initialData, maxResults);
        return videos;
      } catch (parseError) {
        console.error('Error parsing YouTube initial data:', parseError);
      }
    }

    // Fallback: Try to extract video IDs from HTML using regex
    const videoIds = extractVideoIdsFromHTML(html, maxResults);
    return videoIds.map((videoId) => ({
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title: 'YouTube Video',
      description: '',
    }));

  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    return [];
  }
}

/**
 * Extract videos from YouTube's initial data JSON structure
 */
function extractVideosFromInitialData(data: any, maxResults: number): YouTubeVideoResult[] {
  const videos: YouTubeVideoResult[] = [];

  try {
    // Navigate through YouTube's complex data structure
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    
    for (const section of contents) {
      const itemSection = section?.itemSectionRenderer?.contents || [];
      
      for (const item of itemSection) {
        const videoRenderer = item?.videoRenderer;
        if (videoRenderer && videos.length < maxResults) {
          const videoId = videoRenderer.videoId;
          const title = videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText || 'Untitled';
          const description = videoRenderer.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '';
          const thumbnail = videoRenderer.thumbnail?.thumbnails?.[videoRenderer.thumbnail.thumbnails.length - 1]?.url || '';
          const channelTitle = videoRenderer.ownerText?.runs?.[0]?.text || '';

          if (videoId) {
            videos.push({
              videoId,
              videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
              title,
              description,
              thumbnail,
              channelTitle,
            });
          }
        }
      }
      
      if (videos.length >= maxResults) break;
    }
  } catch (error) {
    console.error('Error extracting videos from initial data:', error);
  }

  return videos;
}

/**
 * Fallback: Extract video IDs from HTML using regex patterns
 */
function extractVideoIdsFromHTML(html: string, maxResults: number): string[] {
  const videoIds: string[] = [];
  const videoIdPattern = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
  const seen = new Set<string>();

  let match;
  while ((match = videoIdPattern.exec(html)) !== null && videoIds.length < maxResults) {
    const videoId = match[1];
    if (!seen.has(videoId)) {
      seen.add(videoId);
      videoIds.push(videoId);
    }
  }

  return videoIds;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoIdFromUrl(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

