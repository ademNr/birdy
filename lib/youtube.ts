/**
 * YouTube Data API v3 integration
 * Fetches actual YouTube videos based on search queries
 */

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
}

interface YouTubeSearchResponse {
  videos: YouTubeVideo[];
  error?: string;
}

/**
 * Search for YouTube videos using the YouTube Data API v3
 * @param searchQuery - The search query string
 * @param maxResults - Maximum number of results (default: 5)
 * @returns Array of YouTube video objects
 */
export async function searchYouTubeVideos(
  searchQuery: string,
  maxResults: number = 5
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY is not configured. Skipping YouTube video search.');
    return [];
  }

  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }

  try {
    // YouTube Data API v3 search endpoint
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', searchQuery.trim());
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('order', 'relevance'); // Most relevant first
    searchUrl.searchParams.append('videoEmbeddable', 'true'); // Only embeddable videos
    searchUrl.searchParams.append('videoSyndicated', 'true'); // Only videos that can be played on other sites
    searchUrl.searchParams.append('key', apiKey);

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`YouTube API error (${response.status}):`, errorText);
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Get video details (duration) for each video
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const videoDetails = await getVideoDetails(videoIds, apiKey);

    // Map search results to our format
    const videos: YouTubeVideo[] = data.items.map((item: any) => {
      const videoId = item.id.videoId;
      const details = videoDetails.find((v: any) => v.id === videoId);
      
      return {
        videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url || '',
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration: details?.contentDetails?.duration || undefined,
      };
    });

    return videos;
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    // Return empty array on error to not break the flow
    return [];
  }
}

/**
 * Get detailed information about YouTube videos (including duration)
 * @param videoIds - Comma-separated list of video IDs
 * @param apiKey - YouTube API key
 * @returns Array of video details
 */
async function getVideoDetails(videoIds: string, apiKey: string): Promise<any[]> {
  try {
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.append('part', 'contentDetails');
    detailsUrl.searchParams.append('id', videoIds);
    detailsUrl.searchParams.append('key', apiKey);

    const response = await fetch(detailsUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`YouTube API details error (${response.status})`);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching video details:', error);
    return [];
  }
}

/**
 * Format YouTube duration (PT1H2M10S) to human-readable format (1:02:10)
 */
export function formatDuration(duration: string): string {
  if (!duration) return '';
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

