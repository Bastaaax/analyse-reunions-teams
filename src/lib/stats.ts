import type { Intervention, ParticipantStats, MeetingAnalysis, ParsedMeeting } from '@/types'
import { applyTypology, detectInterruptions } from './typology'

const TYPES = ['question', 'declaration', 'proposal', 'reaction', 'interruption'] as const

function emptyTypeBreakdown(): Record<(typeof TYPES)[number], number> {
  return { question: 0, declaration: 0, proposal: 0, reaction: 0, interruption: 0 }
}

export function computeParticipantStats(
  interventions: Intervention[],
  _totalDurationSeconds: number,
  nameMapping: Record<string, string>,
  excludedNames: Set<string>
): ParticipantStats[] {
  const byName = new Map<string, { interventions: Intervention[]; totalSeconds: number }>()

  for (const i of interventions) {
    const name = nameMapping[i.speaker] ?? i.speaker
    if (excludedNames.has(name)) continue
    const existing = byName.get(name)
    if (!existing) {
      byName.set(name, { interventions: [i], totalSeconds: i.durationSeconds })
    } else {
      existing.interventions.push(i)
      existing.totalSeconds += i.durationSeconds
    }
  }

  const totalSpeaking = [...byName.values()].reduce((s, v) => s + v.totalSeconds, 0)

  return [...byName.entries()].map(([name, data]) => {
    const breakdown = emptyTypeBreakdown()
    for (const inv of data.interventions) {
      const t = inv.type ?? 'declaration'
      if (t in breakdown) breakdown[t as keyof typeof breakdown]++
    }
    const typePercent = emptyTypeBreakdown() as Record<string, number>
    const n = data.interventions.length
    TYPES.forEach((t) => {
      typePercent[t] = n > 0 ? (breakdown[t] / n) * 100 : 0
    })
    return {
      name,
      interventionCount: data.interventions.length,
      totalSeconds: data.totalSeconds,
      avgSecondsPerIntervention: data.interventions.length > 0 ? data.totalSeconds / data.interventions.length : 0,
      percentOfTotal: totalSpeaking > 0 ? (data.totalSeconds / totalSpeaking) * 100 : 0,
      typeBreakdown: breakdown,
      typePercent: typePercent as ParticipantStats['typePercent'],
    }
  })
}

export function runAnalysis(
  meeting: ParsedMeeting,
  nameMapping: Record<string, string> = {},
  excludedNames: Set<string> = new Set()
): MeetingAnalysis {
  let interventions = applyTypology(meeting.interventions)
  const interruptions = detectInterruptions(interventions)
  const interruptionSet = new Set(interruptions.map((inv) => `${inv.interrupter}|${inv.timestamp}`))
  interventions = interventions.map((i) => {
    if (interruptionSet.has(`${i.speaker}|${i.startTime}`)) return { ...i, type: 'interruption' as const }
    return i
  })
  const participantStats = computeParticipantStats(
    interventions,
    meeting.durationSeconds,
    nameMapping,
    excludedNames
  )
  return {
    meeting: { ...meeting, interventions },
    participantStats,
    interruptions,
  }
}
