import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Archive, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface ArchiveConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ids: string[]
  entitySingular: string
  entityPlural: string
  onSuccess?: () => void
  onArchive: (ids: string[]) => Promise<void>
}

export function ArchiveConfirmModal({
  open,
  onOpenChange,
  ids,
  entitySingular,
  entityPlural,
  onSuccess,
  onArchive,
}: ArchiveConfirmModalProps) {
  const { t } = useTranslation()
  const [isArchiving, setIsArchiving] = useState(false)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setArchiveError(null)
  }, [open])

  const handleArchive = async () => {
    setIsArchiving(true)
    setArchiveError(null)
    try {
      await onArchive(ids)
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setArchiveError((err as Error).message)
    } finally {
      setIsArchiving(false)
    }
  }

  const isSingle = ids.length === 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Confirm Archive")}</DialogTitle>
          <DialogDescription>
            {isSingle
              ? t("This will archive {{entity}} {{id}}.", { entity: entitySingular, id: ids[0] })
              : t("This will archive {{count}} {{entity}}.", { count: ids.length, entity: entityPlural })}
          </DialogDescription>
        </DialogHeader>

        {archiveError && (
          <p className="text-sm text-destructive">{archiveError}</p>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isArchiving}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="default"
            onClick={handleArchive}
            disabled={isArchiving}
          >
            {isArchiving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Archiving...")}
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                {t("Archive")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
