import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadZone } from '@/components/UploadZone'
import { parseFile } from '@/lib/parse'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function UploadPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setLoading(true)
    try {
      const meeting = await parseFile(file)
      if (meeting.interventions.length === 0) {
        setError('Aucune intervention détectée dans ce fichier. Vérifiez le format (ex. lignes "Nom: texte" ou timestamps VTT/SRT).')
        setLoading(false)
        return
      }
      sessionStorage.setItem('parsedMeeting', JSON.stringify(meeting))
      navigate('/participants')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la lecture du fichier.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Analysez vos réunions Teams</CardTitle>
          <CardDescription>
            Importez une transcription (VTT, SRT ou TXT) pour obtenir des statistiques de participation et la typologie des interventions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <UploadZone onFileAccepted={handleFile} disabled={loading} />
          {loading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyse du fichier en cours…</span>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
