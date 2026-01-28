import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowRight, Merge } from 'lucide-react'
import type { ParsedMeeting } from '@/types'

export function ParticipantsPage() {
  const navigate = useNavigate()
  const [meeting, setMeeting] = useState<ParsedMeeting | null>(null)
  const [nameMap, setNameMap] = useState<Record<string, string>>({})
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [mergeFrom, setMergeFrom] = useState<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('parsedMeeting')
    if (!raw) {
      navigate('/')
      return
    }
    try {
      const data = JSON.parse(raw) as ParsedMeeting
      setMeeting(data)
      const initial: Record<string, string> = {}
      data.participantNames.forEach((n) => (initial[n] = n))
      setNameMap(initial)
    } catch {
      navigate('/')
    }
  }, [navigate])

  const toggleExcluded = (name: string) => {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const startMerge = (name: string) => {
    setMergeFrom((prev) => (prev === name ? null : name))
  }

  const doMerge = (into: string) => {
    if (!mergeFrom || mergeFrom === into) return
    setNameMap((prev) => {
      const next = { ...prev }
      next[mergeFrom] = into
      return next
    })
    setMergeFrom(null)
  }

  if (!meeting) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Participants détectés</CardTitle>
            <CardDescription>
              Vérifiez les noms, fusionnez les doublons (ex. "Jean" et "Jean D.") et excluez les bots si besoin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {meeting.participantNames.map((original) => {
              const displayName = nameMap[original] ?? original
              const isExcluded = excluded.has(displayName)
              const isMergeSource = mergeFrom === original
              return (
                <div
                  key={original}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                >
                  <Checkbox
                    checked={isExcluded}
                    onCheckedChange={() => toggleExcluded(displayName)}
                  />
                  <span className={isExcluded ? 'text-muted-foreground line-through' : ''}>
                    {displayName}
                  </span>
                  {!isExcluded && (
                    <>
                      <Input
                        className="max-w-[200px]"
                        value={displayName}
                        onChange={(e) =>
                          setNameMap((prev) => ({ ...prev, [original]: e.target.value }))
                        }
                      />
                      <Button
                        variant={isMergeSource ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => (isMergeSource ? setMergeFrom(null) : startMerge(original))}
                      >
                        <Merge className="h-4 w-4" />
                        Fusionner
                      </Button>
                      {mergeFrom && mergeFrom !== original && (
                        <Button size="sm" onClick={() => doMerge(displayName)}>
                          Fusionner vers « {displayName} »
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>
            Retour
          </Button>
          <Button
            onClick={() => {
              sessionStorage.setItem('nameMap', JSON.stringify(nameMap))
              sessionStorage.setItem('excluded', JSON.stringify([...excluded]))
              navigate('/dashboard')
            }}
          >
            Lancer l'analyse
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
