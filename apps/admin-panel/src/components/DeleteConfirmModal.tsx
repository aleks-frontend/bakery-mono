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
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface DeleteConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ids: string[]
  entitySingular: string
  entityPlural: string
  onSuccess?: () => void
  onDelete: (ids: string[]) => Promise<void>
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  ids,
  entitySingular,
  entityPlural,
  onSuccess,
  onDelete,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setDeleteError(null)
  }, [open])

  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(ids)
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setIsDeleting(false)
    }
  }

  const isSingle = ids.length === 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Confirm Deletion")}</DialogTitle>
          <DialogDescription>
            {isSingle
              ? t("This will permanently delete {{entity}} {{id}}.", { entity: entitySingular, id: ids[0] })
              : t("This will permanently delete {{count}} {{entity}}.", { count: ids.length, entity: entityPlural })}{" "}
            {t("This action cannot be undone.")}
          </DialogDescription>
        </DialogHeader>

        {deleteError && (
          <p className="text-sm text-destructive">{deleteError}</p>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Deleting...")}
              </>
            ) : (
              t("Delete")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
