import type { Intervention, InterventionType } from '@/types'

const INTERROGATIVES = ['qui', 'que', 'quoi', 'où', 'quand', 'comment', 'pourquoi', 'est-ce que', 'quel', 'quelle', 'quels', 'quelles']
const PROPOSAL_KEYWORDS = [
  'je propose', 'on pourrait', 'il faudrait', 'suggère', 'recommande', 'préconise',
  'je suggère', 'je recommande', 'nous pourrions', 'on pourrait', 'il serait',
]
const REACTION_WORDS = ['oui', 'non', 'd\'accord', 'ok', 'exactement', 'tout à fait', 'bien sûr', 'absolument', 'voilà', 'effectivement', 'parfait', 'très bien', 'compris']
const REACTION_MAX_WORDS = 5

export function classifyIntervention(text: string): InterventionType {
  const t = text.trim()
  if (!t) return 'declaration'

  if (isQuestion(t)) return 'question'
  if (isReaction(t)) return 'reaction'
  if (isProposal(t)) return 'proposal'

  return 'declaration'
}

function isQuestion(text: string): boolean {
  if (text.endsWith('?')) return true
  const firstWords = text.toLowerCase().split(/\s+/).slice(0, 4)
  return INTERROGATIVES.some((w) => firstWords.includes(w))
}

function isProposal(text: string): boolean {
  const lower = text.toLowerCase()
  return PROPOSAL_KEYWORDS.some((kw) => lower.includes(kw))
}

function isReaction(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length > REACTION_MAX_WORDS) return false
  return words.every((w) => REACTION_WORDS.includes(w)) || words.length <= 2
}

export function detectInterruptions(interventions: Intervention[]): { interrupter: string; interrupted: string; timestamp: number }[] {
  const result: { interrupter: string; interrupted: string; timestamp: number }[] = []
  for (let i = 1; i < interventions.length; i++) {
    const curr = interventions[i]
    const prev = interventions[i - 1]
    if (curr.startTime < prev.endTime && curr.speaker !== prev.speaker) {
      result.push({
        interrupter: curr.speaker,
        interrupted: prev.speaker,
        timestamp: curr.startTime,
      })
    }
  }
  return result
}

export function applyTypology(interventions: Intervention[]): Intervention[] {
  return interventions.map((i) => {
    const type = i.speaker === 'Interruption' ? 'interruption' : classifyIntervention(i.text)
    return { ...i, type }
  })
}
