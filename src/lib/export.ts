import type { MeetingAnalysis } from '@/types'
import { formatDurationShort } from '@/lib/utils'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportCSV(analysis: MeetingAnalysis): void {
  const headers = [
    'Participant',
    'Interventions',
    'Temps total (s)',
    'Temps moyen (s)',
    '% temps',
    '% Questions',
    '% Déclarations',
    '% Propositions',
    '% Réactions',
    '% Interruptions',
  ]
  const rows = analysis.participantStats.map((p) => [
    p.name,
    String(p.interventionCount),
    String(p.totalSeconds),
    String(p.avgSecondsPerIntervention.toFixed(1)),
    `${p.percentOfTotal.toFixed(1)}%`,
    `${(p.typePercent.question ?? 0).toFixed(1)}%`,
    `${(p.typePercent.declaration ?? 0).toFixed(1)}%`,
    `${(p.typePercent.proposal ?? 0).toFixed(1)}%`,
    `${(p.typePercent.reaction ?? 0).toFixed(1)}%`,
    `${(p.typePercent.interruption ?? 0).toFixed(1)}%`,
  ])
  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analyse-reunion-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportPDF(analysis: MeetingAnalysis): void {
  const doc = new jsPDF()
  const { meeting, participantStats, interruptions } = analysis

  doc.setFontSize(18)
  doc.text('Rapport d\'analyse de réunion', 14, 20)
  doc.setFontSize(11)
  doc.text(
    `Durée : ${formatDurationShort(meeting.durationSeconds)} — ${participantStats.length} participants — ${meeting.interventions.length} interventions`,
    14,
    28
  )

  const tableData = participantStats.map((p) => [
    p.name,
    String(p.interventionCount),
    formatDurationShort(p.totalSeconds),
    `${p.percentOfTotal.toFixed(1)} %`,
    `${(p.typePercent.question ?? 0).toFixed(0)} %`,
    `${(p.typePercent.proposal ?? 0).toFixed(0)} %`,
    `${(p.typePercent.reaction ?? 0).toFixed(0)} %`,
  ])
  autoTable(doc, {
    startY: 36,
    head: [['Participant', 'Interv.', 'Temps', '% temps', 'Questions', 'Propositions', 'Réactions']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  })

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
  if (interruptions.length > 0 && y < 260) {
    doc.setFontSize(14)
    doc.text('Interruptions détectées', 14, y)
    y += 8
    doc.setFontSize(10)
    interruptions.slice(0, 15).forEach((inv) => {
      doc.text(`${inv.interrupter} → ${inv.interrupted} (${formatDurationShort(inv.timestamp)})`, 14, y)
      y += 6
    })
  }

  doc.save(`analyse-reunion-${new Date().toISOString().slice(0, 10)}.pdf`)
}
