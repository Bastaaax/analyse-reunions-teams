import { useCallback, useState } from 'react'
import { Upload, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateFile } from '@/lib/parse'
import { Button } from '@/components/ui/button'

const ACCEPT = '.vtt,.srt,.txt'
const MAX_SIZE_MB = 10

interface UploadZoneProps {
  onFileAccepted: (file: File) => void
  disabled?: boolean
}

export function UploadZone({ onFileAccepted, disabled }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File | null) => {
      setError(null)
      if (!file) return
      const result = validateFile(file)
      if (!result.ok) {
        setError(result.error)
        return
      }
      onFileAccepted(file)
    },
    [onFileAccepted]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      if (disabled) return
      const file = e.dataTransfer.files?.[0]
      handleFile(file ?? null)
    },
    [disabled, handleFile]
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      handleFile(file ?? null)
      e.target.value = ''
    },
    [handleFile]
  )

  return (
    <div className="space-y-3">
      <label
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer',
          dragActive && !disabled && 'border-primary bg-primary/5',
          !dragActive && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onInputChange}
          disabled={disabled}
        />
        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground mb-1">
          Glissez votre fichier ici ou
        </p>
        <Button type="button" variant="outline" size="lg" asChild>
          <span>Parcourir les fichiers</span>
        </Button>
        <p className="text-sm text-muted-foreground mt-4">
          Formats acceptés : .vtt, .srt, .txt — max {MAX_SIZE_MB} Mo
        </p>
      </label>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
