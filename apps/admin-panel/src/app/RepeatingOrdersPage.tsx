import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useRepeatingOrdersQuery } from "@/hooks/useRepeatingOrdersQuery"
import { useDeleteRepeatingOrderMutation } from "@/hooks/useDeleteRepeatingOrderMutation"
import { RepeatingOrdersTable } from "@/components/RepeatingOrdersTable"
import { RepeatingOrderFormModal } from "@/components/RepeatingOrderFormModal"
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal"
import { BulkPanel } from "@/components/BulkPanel"
import type { RepeatingOrder } from "@bakery/api-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Search, Trash2, X } from "lucide-react"

export function RepeatingOrdersPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useRepeatingOrdersQuery()
  const repeatingOrders = useMemo(() => data ?? [], [data])
  const deleteMutation = useDeleteRepeatingOrderMutation()

  const [selectedRepeatingOrder, setSelectedRepeatingOrder] = useState<RepeatingOrder | undefined>()
  const [selectedRepeatingOrders, setSelectedRepeatingOrders] = useState<RepeatingOrder[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [idsToDelete, setIdsToDelete] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return repeatingOrders
    const q = searchQuery.toLowerCase()
    return repeatingOrders.filter(
      (r) => r.recipient.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q)
    )
  }, [repeatingOrders, searchQuery])

  const handleAddNew = () => {
    setSelectedRepeatingOrder(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (repeatingOrder: RepeatingOrder) => {
    setSelectedRepeatingOrder(repeatingOrder)
    setIsModalOpen(true)
  }

  const handleDelete = (repeatingOrder: RepeatingOrder) => {
    setIdsToDelete([repeatingOrder.id])
    setDeleteConfirmOpen(true)
  }

  const handleBulkDelete = () => {
    setIdsToDelete(selectedRepeatingOrders.map((r) => r.id))
    setDeleteConfirmOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("Loading...")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive font-medium mb-2">{t("Error loading repeating orders")}</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("Repeating Orders")}</h1>
          <p className="text-muted-foreground">{t("Manage standing weekly orders")}</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          {t("Add Repeating Order")}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          name="search"
          placeholder={t("Search by recipient or phone...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          autoComplete="off"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("Showing {{count}} of {{total}} repeating orders", {
              count: filtered.length,
              total: repeatingOrders.length,
            })}
          </p>
        </div>
        <RepeatingOrdersTable
          repeatingOrders={filtered}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSelectionChange={setSelectedRepeatingOrders}
        />
      </div>

      <BulkPanel count={selectedRepeatingOrders.length}>
        <Button type="button" variant="destructive" size="xs" onClick={handleBulkDelete}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("Delete selected")}
        </Button>
      </BulkPanel>

      <RepeatingOrderFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        repeatingOrder={selectedRepeatingOrder}
      />

      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        ids={idsToDelete}
        entitySingular={t("repeating order")}
        entityPlural={t("repeating orders")}
        onDelete={(ids) => deleteMutation.mutateAsync(ids).then(() => {})}
      />
    </div>
  )
}
