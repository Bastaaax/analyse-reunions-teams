/** Une prise de parole dans la transcription */
export interface Intervention {
  id: string
  speaker: string
  text: string
  startTime: number // secondes
  endTime: number
  durationSeconds: number
  type?: InterventionType
}

export type InterventionType =
  | 'question'
  | 'declaration'
  | 'proposal'
  | 'reaction'
  | 'interruption'

/** Participant avec stats agrégées */
export interface ParticipantStats {
  name: string
  interventionCount: number
  totalSeconds: number
  avgSecondsPerIntervention: number
  percentOfTotal: number
  typeBreakdown: Record<InterventionType, number>
  typePercent: Record<InterventionType, number>
  excluded?: boolean
}

/** Résultat du parsing d'un fichier */
export interface ParsedMeeting {
  interventions: Intervention[]
  durationSeconds: number
  participantNames: string[]
}

/** Données d'analyse complète (après typologie et stats) */
export interface MeetingAnalysis {
  meeting: ParsedMeeting
  participantStats: ParticipantStats[]
  interruptions: { interrupter: string; interrupted: string; timestamp: number }[]
}

export const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  question: 'Question',
  declaration: 'Déclaration',
  proposal: 'Proposition',
  reaction: 'Réaction / Validation',
  interruption: 'Interruption',
}
