// src/utils/youtubeUtils.js
export const getYouTubeThumbnail = (url) => {
  if (!url) return null;
  
  try {
    // Handle YouTube Shorts URLs
    if (url.includes('youtube.com/shorts/')) {
      const videoId = url.split('/shorts/')[1].split('?')[0];
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    
    // Handle regular YouTube URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`;
    }
  } catch (e) {
    console.error('Error parsing YouTube URL:', e);
  }
  return null;
};