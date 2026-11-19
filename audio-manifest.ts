/**
 * Recorded-voice manifest.
 *
 * Map the exact (lower-case) spoken text to an audio file. Anything listed here
 * replaces browser text-to-speech everywhere it is spoken.
 *
 * Example after recording professional voices into /public/audio:
 *   "ma": "/audio/ma.mp3",
 *   "mama": "/audio/mama.mp3",
 *   "hebat!": "/audio/praise-hebat.mp3",
 *
 * Supabase alternative: upload to a Storage bucket and set learning_items.audio_url
 * (per item) or lessons.audio_url (per lesson instructions) — those win over this file.
 */
export const AUDIO_MANIFEST: Record<string, string> = {};
