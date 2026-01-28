import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Bar as RechartsBar,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { runAnalysis } from '@/lib/stats'
import { formatDuration, formatDurationShort } from '@/lib/utils'
import type { ParsedMeeting, MeetingAnalysis, InterventionType } from '@/types'
import { INTERVENTION_TYPE_LABELS } from '@/types'
import { Download, FileText, Home } from 'lucide-react'
import { exportCSV, exportPDF } from '@/lib/export'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export function DashboardPage() {
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null)

  useEffect(() => {
    const rawMeeting = sessionStorage.getItem('parsedMeeting')
    const rawNameMap = sessionStorage.getItem('nameMap')
    const rawExcluded = sessionStorage.getItem('excluded')
    if (!rawMeeting) {
      navigate('/')
      return
    }
    try {
      const meeting = JSON.parse(rawMeeting) as ParsedMeeting
      const nameMap = rawNameMap ? (JSON.parse(rawNameMap) as Record<string, string>) : {}
      const excluded = rawExcluded ? new Set(JSON.parse(rawExcluded) as string[]) : new Set<string>()
      setAnalysis(runAnalysis(meeting, nameMap, excluded))
    } catch {
      navigate('/')
    }
  }, [navigate])

  const pieData = useMemo(() => {
    if (!analysis) return []
    return analysis.participantStats.map((p, i) => ({
      name: p.name,
      value: p.totalSeconds,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))
  }, [analysis])

  const barData = useMemo(() => {
    if (!analysis) return []
    return analysis.participantStats.map((p) => ({
      name: p.name,
      interventions: p.interventionCount,
      temps: Math.round(p.totalSeconds),
    }))
  }, [analysis])

  const typeBreakdownData = useMemo(() => {
    if (!analysis) return []
    const types: InterventionType[] = ['question', 'declaration', 'proposal', 'reaction', 'interruption']
    return analysis.participantStats.map((p) => {
      const row: Record<string, string | number> = { name: p.name }
      types.forEach((t) => (row[INTERVENTION_TYPE_LABELS[t]] = ((p.typePercent[t] ?? 0) / 100)))
      return row
    })
  }, [analysis])

  if (!analysis) return null

  const { meeting, participantStats, interruptions } = analysis

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Résultats de l'analyse</h1>
            <p className="text-muted-foreground">
              Durée : {formatDuration(meeting.durationSeconds)} — {participantStats.length} participants — {meeting.interventions.length} interventions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Nouvelle analyse
            </Button>
            <Button variant="outline" onClick={() => exportCSV(analysis)}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => exportPDF(analysis)}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Répartition du temps de parole</CardTitle>
              <CardDescription>Pourcentage du temps total par participant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                    <Tooltip formatter={(value: number) => formatDuration(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nombre d'interventions</CardTitle>
              <CardDescription>Par participant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 80 }}>
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="interventions" fill="#3b82f6" name="Interventions" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tableau récapitulatif</CardTitle>
            <CardDescription>Métriques par participant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Participant</th>
                    <th className="text-right py-2 px-3">Interventions</th>
                    <th className="text-right py-2 px-3">Temps total</th>
                    <th className="text-right py-2 px-3">Moyenne / interv.</th>
                    <th className="text-right py-2 px-3">% temps</th>
                    <th className="text-right py-2 px-3">Questions</th>
                    <th className="text-right py-2 px-3">Propositions</th>
                    <th className="text-right py-2 px-3">Réactions</th>
                  </tr>
                </thead>
                <tbody>
                  {participantStats.map((p) => (
                    <tr key={p.name} className="border-b">
                      <td className="py-2 px-3 font-medium">{p.name}</td>
                      <td className="text-right py-2 px-3">{p.interventionCount}</td>
                      <td className="text-right py-2 px-3">{formatDurationShort(p.totalSeconds)}</td>
                      <td className="text-right py-2 px-3">{formatDurationShort(p.avgSecondsPerIntervention)}</td>
                      <td className="text-right py-2 px-3">{p.percentOfTotal.toFixed(1)} %</td>
                      <td className="text-right py-2 px-3">{p.typePercent.question?.toFixed(0) ?? 0} %</td>
                      <td className="text-right py-2 px-3">{p.typePercent.proposal?.toFixed(0) ?? 0} %</td>
                      <td className="text-right py-2 px-3">{p.typePercent.reaction?.toFixed(0) ?? 0} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {interruptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Interruptions détectées</CardTitle>
              <CardDescription>Interventions qui chevauchent la précédente</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {interruptions.slice(0, 20).map((inv, i) => (
                  <li key={i}>
                    <strong>{inv.interrupter}</strong> a interrompu <strong>{inv.interrupted}</strong> à {formatDurationShort(inv.timestamp)}
                  </li>
                ))}
                {interruptions.length > 20 && (
                  <li className="text-muted-foreground">… et {interruptions.length - 20} autres</li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Typologie des interventions</CardTitle>
            <CardDescription>Répartition par type (question, déclaration, proposition, réaction, interruption)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeBreakdownData} stackOffset="expand" margin={{ left: 80 }}>
                  <XAxis type="number" tickFormatter={(v) => `${Math.round(v * 100)}%`} domain={[0, 1]} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${Math.round(Number(v) * 100)} %`} />
                  {(['question', 'declaration', 'proposal', 'reaction', 'interruption'] as const).map((t, i) => (
                    <RechartsBar
                      key={t}
                      dataKey={INTERVENTION_TYPE_LABELS[t]}
                      stackId="a"
                      fill={CHART_COLORS[i]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
