// Audio export utilities
// Dependencies: lamejs for MP3 encoding, jszip for ZIP archives, file-saver for downloads

import type { Mp3Encoder as Mp3EncoderType } from 'lamejs';
import type JSZipType from 'jszip';
import type { saveAs as saveAsType } from 'file-saver';

// Re-export types for use in other modules
export type { Mp3EncoderType, JSZipType, saveAsType };
