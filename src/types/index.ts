export interface Game {
  id: string;
  name: string;
  thumbnail: string;
  slug: string;
  description: string;
  bannerImage?: string; // Optional: For featured game banner
  dataAiHint?: string; // For placeholder image search keywords
}
