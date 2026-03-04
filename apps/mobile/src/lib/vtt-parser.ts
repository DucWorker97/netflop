/**
 * VTT Subtitle Parser and utilities
 */

export interface SubtitleCue {
    id: string;
    startTime: number; // in milliseconds
    endTime: number;   // in milliseconds
    text: string;
}

/**
 * Parse VTT timestamp to milliseconds
 * Format: 00:00:00.000 or 00:00.000
 */
function parseTimestamp(timestamp: string): number {
    const parts = timestamp.trim().split(':');
    let hours = 0, minutes = 0, seconds = 0;

    if (parts.length === 3) {
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
        seconds = parseFloat(parts[2].replace(',', '.'));
    } else if (parts.length === 2) {
        minutes = parseInt(parts[0], 10);
        seconds = parseFloat(parts[1].replace(',', '.'));
    }

    return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

/**
 * Parse VTT file content into cues
 */
export function parseVTT(content: string): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    const lines = content.split('\n');

    let i = 0;
    let cueIndex = 0;

    // Skip WEBVTT header
    while (i < lines.length && !lines[i].includes('-->')) {
        i++;
    }

    while (i < lines.length) {
        const line = lines[i].trim();

        // Look for timestamp line
        if (line.includes('-->')) {
            const [startStr, endStr] = line.split('-->').map(s => s.trim());
            const startTime = parseTimestamp(startStr);
            const endTime = parseTimestamp(endStr);

            // Collect text lines
            const textLines: string[] = [];
            i++;
            while (i < lines.length && lines[i].trim() !== '') {
                textLines.push(lines[i].trim());
                i++;
            }

            if (textLines.length > 0) {
                cues.push({
                    id: `cue-${cueIndex++}`,
                    startTime,
                    endTime,
                    text: textLines.join('\n'),
                });
            }
        } else {
            i++;
        }
    }

    return cues;
}

/**
 * Find the active cue for a given time position
 */
export function findActiveCue(cues: SubtitleCue[], positionMs: number): SubtitleCue | null {
    for (const cue of cues) {
        if (positionMs >= cue.startTime && positionMs <= cue.endTime) {
            return cue;
        }
    }
    return null;
}

/**
 * Fetch and parse VTT from URL
 */
export async function fetchSubtitles(url: string): Promise<SubtitleCue[]> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch subtitles: ${response.status}`);
        }
        const content = await response.text();
        return parseVTT(content);
    } catch (error) {
        console.error('Error fetching subtitles:', error);
        return [];
    }
}
