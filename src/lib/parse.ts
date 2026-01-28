import type { Intervention, ParsedMeeting } from '@/types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTENSIONS = ['.vtt', '.srt', '.txt', '.docx']

export function validateFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: 'Le fichier ne doit pas dépasser 10 Mo.' }
  }
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, error: `Format non accepté. Utilisez : ${ALLOWED_EXTENSIONS.join(', ')}` }
  }
  if (ext === '.docx') {
    return { ok: false, error: 'Le format .docx sera supporté prochainement. Utilisez .vtt, .srt ou .txt pour l\'instant.' }
  }
  return { ok: true }
}

/** Parse un timestamp VTT/SRT (ex: 00:01:23.456) en secondes */
function parseTimestamp(s: string): number {
  const trimmed = s.trim().replace(',', '.')
  const parts = trimmed.split(':')
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0
    const m = parseInt(parts[1], 10) || 0
    const secParts = parts[2].split('.')
    const sec = parseInt(secParts[0], 10) || 0
    const ms = parseInt(secParts[1]?.slice(0, 3) || '0', 10) || 0
    return h * 3600 + m * 60 + sec + ms / 1000
  }
  return 0
}

/** Regex pour "00:00:00.000 --> 00:00:00.000" (VTT) ou "1" puis "00:00:00,000 --> ..." (SRT) */
const TIME_RANGE = /^(\d{1,2}:\d{2}:\d{2}[.,]\d{2,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{2,3})/

/** Extrait le speaker et le texte depuis une ligne "Speaker: text" */
function parseSpeakerLine(line: string): { speaker: string; text: string } {
  const colonIndex = line.indexOf(':')
  if (colonIndex > 0) {
    const speaker = line.slice(0, colonIndex).trim()
    const text = line.slice(colonIndex + 1).trim()
    return { speaker: speaker || 'Inconnu', text }
  }
  return { speaker: 'Inconnu', text: line.trim() }
}

/** Format Teams / VTT avec balise voix : <v Nom Prénom>texte</v> */
const VOICE_TAG = /<v\s+([^>]+)>\s*([\s\S]*?)\s*<\/v>/i

function parseVoiceTag(block: string): { speaker: string; text: string } | null {
  const m = block.trim().match(VOICE_TAG)
  if (m) {
    const speaker = m[1].trim()
    const text = m[2].trim().replace(/\s+/g, ' ')
    return { speaker: speaker || 'Inconnu', text }
  }
  return null
}

/** Parse contenu VTT (avec ou sans en-tête WEBVTT) */
export function parseVTT(content: string): Intervention[] {
  const lines = content.split(/\r?\n/)
  const interventions: Intervention[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const match = line.match(TIME_RANGE)
    if (match) {
      const startTime = parseTimestamp(match[1])
      const endTime = parseTimestamp(match[2])
      const textParts: string[] = []
      i += 1
      while (i < lines.length && lines[i].trim() !== '') {
        textParts.push(lines[i])
        i += 1
      }
      const fullText = textParts.join(' ')
      const voice = parseVoiceTag(fullText)
      const { speaker, text } = voice ?? parseSpeakerLine(fullText)
      interventions.push({
        id: `i-${interventions.length}`,
        speaker,
        text: text || fullText,
        startTime,
        endTime,
        durationSeconds: Math.max(0, endTime - startTime),
      })
    } else {
      i += 1
    }
  }
  return interventions
}

/** Parse SRT : blocs "index" / "time --> time" / "text" */
export function parseSRT(content: string): Intervention[] {
  const blocks = content.trim().split(/\n\s*\n/)
  const interventions: Intervention[] = []

  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) continue
    const timeMatch = lines[1].match(TIME_RANGE)
    if (!timeMatch) continue
    const startTime = parseTimestamp(timeMatch[1])
    const endTime = parseTimestamp(timeMatch[2])
    const textLines = lines.slice(2)
    const fullText = textLines.join(' ')
    const voice = parseVoiceTag(fullText)
    const { speaker, text } = voice ?? parseSpeakerLine(fullText)
    interventions.push({
      id: `i-${interventions.length}`,
      speaker,
      text: text || fullText,
      startTime,
      endTime,
      durationSeconds: Math.max(0, endTime - startTime),
    })
  }
  return interventions
}

/** Parse TXT : lignes "Speaker: text" ou blocs avec timestamps optionnels */
export function parseTXT(content: string): Intervention[] {
  const lines = content.split(/\r?\n/)
  const interventions: Intervention[] = []
  let currentSpeaker = 'Inconnu'
  let currentText: string[] = []
  let lastEndTime = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (currentText.length > 0) {
        const text = currentText.join(' ')
        const duration = Math.max(3, text.split(/\s/).length * 0.5)
        interventions.push({
          id: `i-${interventions.length}`,
          speaker: currentSpeaker,
          text,
          startTime: lastEndTime,
          endTime: lastEndTime + duration,
          durationSeconds: duration,
        })
        lastEndTime += duration
        currentText = []
      }
      continue
    }
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex > 0 && /^[A-Za-zÀ-ÿ\s.-]+$/.test(trimmed.slice(0, colonIndex).trim())) {
      if (currentText.length > 0) {
        const text = currentText.join(' ')
        const duration = Math.max(3, text.split(/\s/).length * 0.5)
        interventions.push({
          id: `i-${interventions.length}`,
          speaker: currentSpeaker,
          text,
          startTime: lastEndTime,
          endTime: lastEndTime + duration,
          durationSeconds: duration,
        })
        lastEndTime += duration
        currentText = []
      }
      currentSpeaker = trimmed.slice(0, colonIndex).trim()
      currentText.push(trimmed.slice(colonIndex + 1).trim())
    } else {
      currentText.push(trimmed)
    }
  }
  if (currentText.length > 0) {
    const text = currentText.join(' ')
    const duration = Math.max(3, text.split(/\s/).length * 0.5)
    interventions.push({
      id: `i-${interventions.length}`,
      speaker: currentSpeaker,
      text,
      startTime: lastEndTime,
      endTime: lastEndTime + duration,
      durationSeconds: duration,
    })
  }
  return interventions
}

export async function parseFile(file: File): Promise<ParsedMeeting> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  const content = await file.text()
  let interventions: Intervention[]

  if (ext === 'vtt') interventions = parseVTT(content)
  else if (ext === 'srt') interventions = parseSRT(content)
  else if (ext === 'txt') interventions = parseTXT(content)
  else {
    if (content.trimStart().toUpperCase().startsWith('WEBVTT')) interventions = parseVTT(content)
    else if (TIME_RANGE.test(content)) interventions = parseSRT(content)
    else interventions = parseTXT(content)
  }

  const durationSeconds =
    interventions.length > 0
      ? Math.max(
          ...interventions.map((i) => i.endTime),
          0
        )
      : 0
  const participantNames = [...new Set(interventions.map((i) => i.speaker))].sort()

  return { interventions, durationSeconds, participantNames }
}
