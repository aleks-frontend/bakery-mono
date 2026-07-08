import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useOrdersQuery } from "@/hooks/useOrdersQuery"
import { useUpdateOrdersStatusBatchMutation } from "@/hooks/useUpdateOrderStatus"
import { useDeleteOrdersMutation } from "@/hooks/useDeleteOrdersMutation"
import { OrdersTable } from "@/components/OrdersTable"
import { OrderDetailsModal } from "@/components/OrderDetailsModal"
import { ManualOrderModal } from "@/components/ManualOrderModal"
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal"
import { ArchiveConfirmModal } from "@/components/ArchiveConfirmModal"
import { BulkPanel } from "@/components/BulkPanel"
import { Order, OrderStatus } from "@/types/order"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Archive,
  ClipboardList,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react"

export function OrdersPage() {
  const { t } = useTranslation()
  const { data: orders = [], isLoading, error } = useOrdersQuery()
  const batchStatusMutation = useUpdateOrdersStatusBatchMutation()
  const deleteOrdersMutation = useDeleteOrdersMutation()

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([])
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [orderIdsToDelete, setOrderIdsToDelete] = useState<string[]>([])
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const [orderIdsToArchive, setOrderIdsToArchive] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | "">("")
  const [workshopPdfLoading, setWorkshopPdfLoading] = useState(false)
  const [xlsLoading, setXlsLoading] = useState(false)
  const [stickersPdfLoading, setStickersPdfLoading] = useState(false)

  const filteredOrders = useMemo(() => {
    let filtered = orders

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.recipient.toLowerCase().includes(query) ||
          order.phone.includes(query)
      )
    }

    return filtered
  }, [orders, statusFilter, searchQuery])

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }

  const handleBulkStatusChange = (status: OrderStatus) => {
    setBulkStatus(status)
    const updates = selectedOrders.map((o) => ({ orderId: o.orderId, status }))
    batchStatusMutation.mutate(updates)
  }

  const handleDeleteOrder = (order: Order) => {
    setOrderIdsToDelete([order.orderId])
    setDeleteConfirmOpen(true)
  }

  const handleBulkDelete = () => {
    setOrderIdsToDelete(selectedOrders.map((o) => o.orderId))
    setDeleteConfirmOpen(true)
  }

  const handleArchiveOrder = (order: Order) => {
    setOrderIdsToArchive([order.orderId])
    setArchiveConfirmOpen(true)
  }

  const handleBulkArchive = () => {
    setOrderIdsToArchive(selectedOrders.map((o) => o.orderId))
    setArchiveConfirmOpen(true)
  }

  async function handleGenerateWorkshopList() {
    if (!selectedOrders.length) return
    setWorkshopPdfLoading(true)
    try {
      const { downloadWorkshopListPdf } = await import(
        "@/components/WorkshopListPdf"
      )
      await downloadWorkshopListPdf(selectedOrders, {
        title: t("Workshop List"),
        generatedAt: t("Generated at"),
        total: t("Total"),
        noArticles: t("No articles"),
        unparsedLines: t("Unparsed lines"),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setWorkshopPdfLoading(false)
    }
  }

  async function handleGeneratePackageStickers() {
    if (!selectedOrders.length) return
    setStickersPdfLoading(true)
    try {
      const { downloadPackageStickersPdf } = await import(
        "@/components/PackageStickersPdf"
      )
      await downloadPackageStickersPdf(selectedOrders, {
        title: t("Package Stickers"),
        total: t("Total"),
        noArticles: t("No articles"),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setStickersPdfLoading(false)
    }
  }

  async function handleGenerateXls() {
    if (!selectedOrders.length) return
    setXlsLoading(true)
    try {
      const { downloadSelectedOrdersXls } = await import(
        "@/lib/exportSelectedOrdersXls"
      )
      downloadSelectedOrdersXls(selectedOrders)
    } catch (err) {
      console.error(err)
    } finally {
      setXlsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("Loading orders...")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive font-medium mb-2">
              {t("Error loading orders")}
            </p>
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
          <h1 className="text-3xl font-bold tracking-tight">{t("Orders")}</h1>
          <p className="text-muted-foreground">
            {t("Manage bread and pastry orders")}
          </p>
        </div>
        <Button onClick={() => setIsManualOrderModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("Add Manual Order")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
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
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as OrderStatus | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("Filter by status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Statuses")}</SelectItem>
            <SelectItem value="Not received">{t("Not received")}</SelectItem>
            <SelectItem value="In Progress">{t("In Progress")}</SelectItem>
            <SelectItem value="Delivered">{t("Delivered")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("Showing {{count}} of {{total}} orders", {
              count: filteredOrders.length,
              total: orders.length,
            })}
          </p>
        </div>
        <OrdersTable
          orders={filteredOrders}
          onViewDetails={handleViewDetails}
          onDeleteOrder={handleDeleteOrder}
          onArchiveOrder={handleArchiveOrder}
          onSelectionChange={setSelectedOrders}
        />
      </div>

      <BulkPanel count={selectedOrders.length}>
        <div className="flex items-center gap-1.5">
          {batchStatusMutation.isPending && (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          )}
          <select
            value={bulkStatus}
            disabled={batchStatusMutation.isPending}
            onChange={(e) => handleBulkStatusChange(e.target.value as OrderStatus)}
            className="border border-input rounded-md px-2 py-1.5 text-sm bg-background disabled:opacity-50"
          >
            <option value="">{t("Select status...")}</option>
            <option value="Not received">{t("Not received")}</option>
            <option value="In Progress">{t("In Progress")}</option>
            <option value="Delivered">{t("Delivered")}</option>
          </select>
        </div>
        <Button type="button" variant="outline" size="xs" onClick={handleBulkArchive}>
          <Archive className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("Archive selected")}
        </Button>
        <Button type="button" variant="destructive" size="xs" onClick={handleBulkDelete}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("Delete selected")}
        </Button>
        <Button type="button" variant="outline" size="xs" onClick={handleGenerateWorkshopList} disabled={workshopPdfLoading}>
          {workshopPdfLoading
            ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
            : <ClipboardList className="mr-2 h-4 w-4 shrink-0" aria-hidden />}
          {workshopPdfLoading ? t("Generating PDF...") : t("Generate Workshop List")}
        </Button>
        <Button type="button" variant="outline" size="xs" onClick={handleGeneratePackageStickers} disabled={stickersPdfLoading}>
          {stickersPdfLoading
            ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
            : <Tag className="mr-2 h-4 w-4 shrink-0" aria-hidden />}
          {stickersPdfLoading ? t("Generating PDF...") : t("Generate Package Stickers")}
        </Button>
        <Button type="button" variant="outline" size="xs" onClick={handleGenerateXls} disabled={xlsLoading}>
          {xlsLoading
            ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" aria-hidden />
            : <FileSpreadsheet className="mr-2 h-4 w-4 shrink-0" aria-hidden />}
          {xlsLoading ? t("Generating XLS...") : t("Generate XLS")}
        </Button>
      </BulkPanel>

      <OrderDetailsModal
        order={selectedOrder}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        onDeleteOrder={handleDeleteOrder}
        onArchiveOrder={handleArchiveOrder}
      />

      <ManualOrderModal
        open={isManualOrderModalOpen}
        onOpenChange={setIsManualOrderModalOpen}
      />

      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        ids={orderIdsToDelete}
        entitySingular={t("order")}
        entityPlural={t("orders")}
        onDelete={(ids) => deleteOrdersMutation.mutateAsync(ids)}
        onSuccess={() => setIsDetailsModalOpen(false)}
      />

      <ArchiveConfirmModal
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        ids={orderIdsToArchive}
        entitySingular={t("order")}
        entityPlural={t("orders")}
        onSuccess={() => setIsDetailsModalOpen(false)}
      />
    </div>
  )
}
