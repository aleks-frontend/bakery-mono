import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useBreadTypesQuery } from "@/hooks/useBreadTypesQuery"
import { useUpdateBreadTypeAvailabilityMutation } from "@/hooks/useUpdateBreadTypeMutation"
import { useUpdateAcceptingOrdersMutation } from "@/hooks/useUpdateAcceptingOrdersMutation"
import { useDeleteBreadTypesMutation } from "@/hooks/useDeleteBreadTypesMutation"
import { BreadTypesTable } from "@/components/BreadTypesTable"
import { BreadTypeModal } from "@/components/BreadTypeModal"
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal"
import { BreadType } from "@/types/breadType"
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
import { BulkPanel } from "@/components/BulkPanel"
import { Loader2, Plus, Search, Trash2, X } from "lucide-react"

export function BreadTypesPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useBreadTypesQuery()
  const breadTypes = useMemo(() => data?.data ?? [], [data])
  const acceptingOrders = data?.acceptingOrders ?? false
  const availabilityMutation = useUpdateBreadTypeAvailabilityMutation()
  const acceptingMutation = useUpdateAcceptingOrdersMutation()
  const deleteMutation = useDeleteBreadTypesMutation()

  const [selectedBreadType, setSelectedBreadType] = useState<BreadType | undefined>()
  const [selectedBreadTypes, setSelectedBreadTypes] = useState<BreadType[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [idsToDelete, setIdsToDelete] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all")
  const [bulkAvailability, setBulkAvailability] = useState<"" | "true" | "false">("")

  const handleBulkAvailabilityChange = (value: "true" | "false") => {
    setBulkAvailability(value)
    availabilityMutation.mutate({
      ids: selectedBreadTypes.map((b) => b.id),
      available: value === "true",
    })
  }

  const filtered = useMemo(() => {
    let result = breadTypes

    if (availabilityFilter === "available") {
      result = result.filter((b) => b.available)
    } else if (availabilityFilter === "unavailable") {
      result = result.filter((b) => !b.available)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((b) => b.name.toLowerCase().includes(q))
    }

    return result
  }, [breadTypes, availabilityFilter, searchQuery])

  const handleViewDetails = (breadType: BreadType) => {
    setSelectedBreadType(breadType)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setSelectedBreadType(undefined)
    setIsModalOpen(true)
  }

  const handleDeleteBreadType = (breadType: BreadType) => {
    setIdsToDelete([breadType.id])
    setDeleteConfirmOpen(true)
  }

  const handleBulkDelete = () => {
    setIdsToDelete(selectedBreadTypes.map((b) => b.id))
    setDeleteConfirmOpen(true)
  }


  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("Loading bread types...")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive font-medium mb-2">{t("Error loading bread types")}</p>
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
          <h1 className="text-3xl font-bold tracking-tight">{t("Bread Types")}</h1>
          <p className="text-muted-foreground">{t("Manage bread types and availability")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {acceptingMutation.isPending && (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            )}
            <label htmlFor="accepting-orders-toggle" className="text-sm font-medium cursor-pointer">
              {t("Accepting Orders")}
            </label>
            <Switch
              id="accepting-orders-toggle"
              checked={acceptingOrders}
              disabled={acceptingMutation.isPending || isLoading}
              onCheckedChange={(checked) => acceptingMutation.mutate(checked)}
            />
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            {t("Add Bread Type")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder={t("Search by name...")}
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
          value={availabilityFilter}
          onValueChange={(v) => setAvailabilityFilter(v as typeof availabilityFilter)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("Filter by availability")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All")}</SelectItem>
            <SelectItem value="available">{t("Available")}</SelectItem>
            <SelectItem value="unavailable">{t("Unavailable")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("Showing {{count}} of {{total}} bread types", {
              count: filtered.length,
              total: breadTypes.length,
            })}
          </p>
        </div>
        <BreadTypesTable
          breadTypes={filtered}
          onViewDetails={handleViewDetails}
          onDeleteBreadType={handleDeleteBreadType}
          onSelectionChange={setSelectedBreadTypes}
        />
      </div>

      <BulkPanel count={selectedBreadTypes.length}>
        <div className="flex items-center gap-1.5">
          {availabilityMutation.isPending && (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          )}
          <select
            value={bulkAvailability}
            disabled={availabilityMutation.isPending}
            onChange={(e) => handleBulkAvailabilityChange(e.target.value as "true" | "false")}
            className="border border-input rounded-md px-2 py-1.5 text-sm bg-background disabled:opacity-50"
          >
            <option value="">{t("Set availability...")}</option>
            <option value="true">{t("Available")}</option>
            <option value="false">{t("Unavailable")}</option>
          </select>
        </div>
        <Button type="button" variant="destructive" size="xs" onClick={handleBulkDelete}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {t("Delete selected")}
        </Button>
      </BulkPanel>

      <BreadTypeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        breadType={selectedBreadType}
      />

      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        ids={idsToDelete}
        entitySingular={t("bread type")}
        entityPlural={t("bread types")}
        onDelete={(ids) => deleteMutation.mutateAsync(ids)}
      />
    </div>
  )
}
