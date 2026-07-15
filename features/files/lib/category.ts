export type FileCategory = "VIDEO" | "PHOTO" | "AUDIO" | "OTHER";

const VIDEO_EXTENSIONS = [".mp4"];
const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic"];
const AUDIO_EXTENSIONS = [".mp3", ".wav"];

export function getFileCategory(file: { name: string; contentType: string }): FileCategory {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  if (file.contentType.startsWith("video/") || VIDEO_EXTENSIONS.includes(extension)) {
    return "VIDEO";
  }
  if (file.contentType.startsWith("image/") || PHOTO_EXTENSIONS.includes(extension)) {
    return "PHOTO";
  }
  if (file.contentType.startsWith("audio/") || AUDIO_EXTENSIONS.includes(extension)) {
    return "AUDIO";
  }
  return "OTHER";
}
