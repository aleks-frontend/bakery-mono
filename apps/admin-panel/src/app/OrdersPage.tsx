import { useEffect, useMemo, useState } from "react"
import type { RowSelectionState } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"
import { useOrdersQuery } from "@/hooks/useOrdersQuery"
import { useBulkUpdateOrderStatusMutation } from "@/hooks/useUpdateOrderMutation"
import { useDeleteOrderMutation } from "@/hooks/useDeleteOrderMutation"
import { useArchiveOrderMutation } from "@/hooks/useArchiveOrderMutation"
import { useUnarchiveOrderMutation } from "@/hooks/useUnarchiveOrderMutation"
import { useMakeRepeatingMutation } from "@/hooks/useMakeRepeatingMutation"
import { useDeleteRepeatingOrderMutation } from "@/hooks/useDeleteRepeatingOrderMutation"
import { OrdersTable } from "@/components/OrdersTable"
import { OrderDetailsModal } from "@/components/OrderDetailsModal"
import { OrderFormModal } from "@/components/OrderFormModal"
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal"
import { ArchiveConfirmModal } from "@/components/ArchiveConfirmModal"
import { BulkPanel } from "@/components/BulkPanel"
import { ordersClient } from "@/lib/apiClient"
import { ORDER_PAGE_SIZES } from "@bakery/api-client"
import type { Order, OrderPageSize, OrderStatus, OrdersListParams } from "@bakery/api-client"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Archive,
  ArchiveRestore,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react"

type SortableColumn = NonNullable<OrdersListParams["sortBy"]>

export function OrdersPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")
  const [sortBy, setSortBy] = useState<SortableColumn>("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [showArchived, setShowArchived] = useState(false)
  const [hasRemarkFilter, setHasRemarkFilter] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<OrderPageSize>(25)

  const queryParams = {
    search: searchQuery.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    sortBy,
    sortDir,
    archived: showArchived,
    hasRemark: hasRemarkFilter || undefined,
    page,
    pageSize,
  }
  const { data: response, isLoading, error } = useOrdersQuery(queryParams)
  const orders = response?.data ?? []
  const total = response?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  // Selection is keyed by order id and controlled here (not owned by
  // OrdersTable) so it can span every order matching the current filters,
  // not just whatever page happens to be rendered — see handleSelectAllToggle.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  // Running cache of every order object seen so far, keyed by id. Selection
  // via "select all matching" can include orders that were never rendered on
  // the current page, so bulk actions/PDF generation need somewhere else to
  // resolve full Order data (recipient, items, etc.) from a selected id.
  const [orderCache, setOrderCache] = useState<Map<string, Order>>(new Map())
  const [isSelectingAll, setIsSelectingAll] = useState(false)

  useEffect(() => {
    if (!response || response.data.length === 0) return
    setOrderCache((prev) => {
      const next = new Map(prev)
      for (const order of response.data) next.set(order.id, order)
      return next
    })
  }, [response])

  // Any change to what's being asked for (filters, sort, page size) invalidates
  // the current page number — jumping back to page 1 avoids landing on a now
  // out-of-range page (e.g. page 5 of a search that only has 2 results) — and
  // the current selection, since it was scoped to the previous filter set.
  useEffect(() => {
    setPage(1)
    setRowSelection({})
  }, [searchQuery, statusFilter, sortBy, sortDir, showArchived, hasRemarkFilter, pageSize])

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  )
  const selectedOrders = useMemo(
    () => selectedIds.map((id) => orderCache.get(id)).filter((o): o is Order => o != null),
    [selectedIds, orderCache],
  )
  const allSelected = selectedIds.length > 0 && selectedIds.length === total
  const someSelected = selectedIds.length > 0 && !allSelected

  async function handleSelectAllToggle(checked: boolean) {
    if (!checked) {
      setRowSelection({})
      return
    }
    setIsSelectingAll(true)
    try {
      const { data } = await ordersClient.list({ ...queryParams, page: undefined, pageSize: undefined, all: true })
      setOrderCache((prev) => {
        const next = new Map(prev)
        for (const order of data) next.set(order.id, order)
        return next
      })
      setRowSelection(Object.fromEntries(data.map((order) => [order.id, true])))
    } catch (err) {
      console.error(err)
    } finally {
      setIsSelectingAll(false)
    }
  }

  const bulkStatusMutation = useBulkUpdateOrderStatusMutation()
  const deleteOrdersMutation = useDeleteOrderMutation()
  const archiveOrdersMutation = useArchiveOrderMutation()
  const unarchiveOrdersMutation = useUnarchiveOrderMutation()
  const makeRepeatingMutation = useMakeRepeatingMutation()
  const deleteRepeatingOrderMutation = useDeleteRepeatingOrderMutation()

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  // Derived from the live query result (not a captured snapshot) so edits/status
  // changes made while the details modal is open are reflected immediately,
  // instead of requiring a close+reopen to pick up the refetched data.
  const selectedOrder = selectedOrderId ? (orders.find((o) => o.id === selectedOrderId) ?? null) : null
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [orderIdsToDelete, setOrderIdsToDelete] = useState<string[]>([])
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const [orderIdsToArchive, setOrderIdsToArchive] = useState<string[]>([])
  const [unrepeatConfirmOpen, setUnrepeatConfirmOpen] = useState(false)
  const [repeatingOrderIdsToDelete, setRepeatingOrderIdsToDelete] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | "">("")
  const [workshopPdfLoading, setWorkshopPdfLoading] = useState(false)
  const [xlsLoading, setXlsLoading] = useState(false)
  const [stickersPdfLoading, setStickersPdfLoading] = useState(false)

  const handleSortChange = (column: SortableColumn) => {
    if (column === sortBy) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(column)
      setSortDir("desc")
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrderId(order.id)
    setIsDetailsModalOpen(true)
  }

  const handleBulkStatusChange = (status: OrderStatus) => {
    setBulkStatus(status)
    bulkStatusMutation.mutate(
      { ids: selectedOrders.map((o) => o.id), status },
      { onSuccess: () => setRowSelection({}) },
    )
  }

  const handleDeleteOrder = (order: Order) => {
    setOrderIdsToDelete([order.id])
    setDeleteConfirmOpen(true)
  }

  const handleBulkDelete = () => {
    setOrderIdsToDelete(selectedOrders.map((o) => o.id))
    setDeleteConfirmOpen(true)
  }

  // Archiving hides an order, so it's confirmed via a dialog; unarchiving just
  // restores it to the default view, so it happens immediately with no confirmation.
  const handleToggleArchive = (order: Order) => {
    if (order.archived) {
      unarchiveOrdersMutation.mutate([order.id])
    } else {
      setOrderIdsToArchive([order.id])
      setArchiveConfirmOpen(true)
    }
  }

  // Making repeating creates a new RepeatingOrder template right away, so it
  // applies immediately with no confirmation. Un-repeating deletes that whole
  // template (there's no way to unlink just this one order without a new
  // endpoint), which also affects any other orders cloned from the same
  // template — that's destructive enough to confirm first.
  const handleMakeRepeating = (order: Order) => {
    if (order.repeatingOrderId) {
      setRepeatingOrderIdsToDelete([order.repeatingOrderId])
      setUnrepeatConfirmOpen(true)
    } else {
      makeRepeatingMutation.mutate(order.id)
    }
  }

  const handleBulkToggleArchive = () => {
    const ids = selectedOrders.map((o) => o.id)
    if (showArchived) {
      unarchiveOrdersMutation.mutate(ids, { onSuccess: () => setRowSelection({}) })
    } else {
      setOrderIdsToArchive(ids)
      setArchiveConfirmOpen(true)
    }
  }

  async function handleGenerateWorkshopList() {
    if (!selectedOrders.length) return
    setWorkshopPdfLoading(true)
    try {
      const { downloadWorkshopListPdf } = await import("@/components/WorkshopListPdf")
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
      const { downloadPackageStickersPdf } = await import("@/components/PackageStickersPdf")
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
      const { downloadSelectedOrdersXls } = await import("@/lib/exportSelectedOrdersXls")
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
            <p className="text-destructive font-medium mb-2">{t("Error loading orders")}</p>
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
          <h1 className="font-serif text-3xl font-semibold tracking-tight">{t("Orders")}</h1>
          <p className="text-muted-foreground">{t("Manage bread and pastry orders")}</p>
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
          onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("Filter by status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Statuses")}</SelectItem>
            <SelectItem value="NOT_RECEIVED">{t("Not received")}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t("In Progress")}</SelectItem>
            <SelectItem value="DELIVERED">{t("Delivered")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="show-archived-toggle" className="text-sm font-medium cursor-pointer">
            {t("Show archived")}
          </label>
          <Switch id="show-archived-toggle" checked={showArchived} onCheckedChange={setShowArchived} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="has-remark-toggle" className="text-sm font-medium cursor-pointer">
            {t("Only with remarks")}
          </label>
          <Switch id="has-remark-toggle" checked={hasRemarkFilter} onCheckedChange={setHasRemarkFilter} />
        </div>
      </div>

      {/* Orders Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? t("Showing 0 of 0 orders")
              : t("Showing {{from}}-{{to}} of {{total}} orders", {
                  from: (page - 1) * pageSize + 1,
                  to: Math.min(page * pageSize, total),
                  total,
                })}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="page-size-select" className="text-sm text-muted-foreground">
              {t("Rows per page")}
            </label>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => setPageSize(Number(value) as OrderPageSize)}
            >
              <SelectTrigger id="page-size-select" className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <OrdersTable
          orders={orders}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={handleSortChange}
          onViewDetails={handleViewDetails}
          onDeleteOrder={handleDeleteOrder}
          onToggleArchive={handleToggleArchive}
          onMakeRepeating={handleMakeRepeating}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          allSelected={allSelected}
          someSelected={someSelected}
          isSelectingAll={isSelectingAll}
          onSelectAllToggle={handleSelectAllToggle}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("Page {{page}} of {{totalPages}}", { page, totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("Previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              {t("Next")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <BulkPanel count={selectedOrders.length}>
        <div className="flex items-center gap-1.5">
          {bulkStatusMutation.isPending && (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          )}
          <select
            value={bulkStatus}
            disabled={bulkStatusMutation.isPending}
            onChange={(e) => handleBulkStatusChange(e.target.value as OrderStatus)}
            className="border border-input rounded-md px-2 py-1.5 text-sm bg-background disabled:opacity-50"
          >
            <option value="">{t("Select status...")}</option>
            <option value="NOT_RECEIVED">{t("Not received")}</option>
            <option value="IN_PROGRESS">{t("In Progress")}</option>
            <option value="DELIVERED">{t("Delivered")}</option>
          </select>
        </div>
        <Button type="button" variant="outline" size="xs" onClick={handleBulkToggleArchive}>
          {showArchived ? (
            <ArchiveRestore className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <Archive className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          {showArchived ? t("Unarchive selected") : t("Archive selected")}
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
        onToggleArchive={handleToggleArchive}
        onMakeRepeating={handleMakeRepeating}
      />

      <OrderFormModal
        open={isManualOrderModalOpen}
        onOpenChange={setIsManualOrderModalOpen}
      />

      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        ids={orderIdsToDelete}
        entitySingular={t("order")}
        entityPlural={t("orders")}
        onDelete={(ids) => deleteOrdersMutation.mutateAsync(ids).then(() => {})}
        onSuccess={() => {
          setIsDetailsModalOpen(false)
          setRowSelection({})
        }}
      />

      <ArchiveConfirmModal
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        ids={orderIdsToArchive}
        entitySingular={t("order")}
        entityPlural={t("orders")}
        onArchive={(ids) => archiveOrdersMutation.mutateAsync(ids).then(() => {})}
        onSuccess={() => {
          setIsDetailsModalOpen(false)
          setRowSelection({})
        }}
      />

      <DeleteConfirmModal
        open={unrepeatConfirmOpen}
        onOpenChange={setUnrepeatConfirmOpen}
        ids={repeatingOrderIdsToDelete}
        entitySingular={t("repeating order")}
        entityPlural={t("repeating orders")}
        onDelete={(ids) => deleteRepeatingOrderMutation.mutateAsync(ids).then(() => {})}
      />
    </div>
  )
}
