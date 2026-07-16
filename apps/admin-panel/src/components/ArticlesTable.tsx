import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { ArticleWithAvailability } from "@bakery/api-client"
import { ArrowUpDown, Eye, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useUpdateArticleAvailabilityMutation } from "@/hooks/useUpdateArticleMutation"
import { cn } from "@/lib/utils"

interface ArticlesTableProps {
  articles: ArticleWithAvailability[]
  onViewDetails: (article: ArticleWithAvailability) => void
  onDeleteArticle: (article: ArticleWithAvailability) => void
  onSelectionChange?: (selected: ArticleWithAvailability[]) => void
}

function SelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.indeterminate = indeterminate
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
      className="h-4 w-4 rounded border-border accent-primary"
    />
  )
}

export function ArticlesTable({
  articles,
  onViewDetails,
  onDeleteArticle,
  onSelectionChange,
}: ArticlesTableProps) {
  const { t } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { mutate: updateAvailability } = useUpdateArticleAvailabilityMutation()

  const handleAvailabilityToggle = useCallback(
    (article: ArticleWithAvailability) => {
      setUpdatingId(article.id)
      updateAvailability(
        { ids: [article.id], available: !article.available },
        { onSettled: () => setUpdatingId(null) }
      )
    },
    [updateAvailability]
  )

  const columns: ColumnDef<ArticleWithAvailability>[] = useMemo(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <SelectCheckbox
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={(checked) => table.toggleAllRowsSelected(checked)}
              ariaLabel={t("Select all")}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <SelectCheckbox
              checked={row.getIsSelected()}
              onChange={(checked) => row.toggleSelected(checked)}
              ariaLabel={t("Select article")}
            />
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 text-xs font-semibold"
          >
            {t("Name")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 text-xs font-semibold"
          >
            {t("Price")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">
            {row.getValue("price")} {t("RSD")}
          </div>
        ),
      },
      {
        accessorKey: "capacityPerCycle",
        header: t("Capacity per cycle"),
        cell: ({ row }) => {
          const capacity = row.original.capacityPerCycle
          return (
            <div className="text-muted-foreground">
              {capacity == null ? t("Unlimited") : capacity}
            </div>
          )
        },
      },
      {
        accessorKey: "available",
        header: t("Available"),
        cell: ({ row }) => {
          const article = row.original
          return (
            <Switch
              checked={article.available}
              disabled={updatingId === article.id}
              onCheckedChange={() => handleAvailabilityToggle(article)}
            />
          )
        },
      },
      {
        accessorKey: "availableNow",
        header: t("Available now"),
        cell: ({ row }) => {
          const availableNow = row.original.availableNow
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                availableNow
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {availableNow ? t("In stock") : t("Sold out")}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: t("Actions"),
        cell: ({ row }) => {
          const article = row.original
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(article)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t("View details")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDeleteArticle(article)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [t, onViewDetails, onDeleteArticle, handleAvailabilityToggle, updatingId]
  )

  const table = useReactTable({
    data: articles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    state: { sorting, rowSelection },
  })

  useEffect(() => {
    if (!onSelectionChange) return
    const selected = table.getSelectedRowModel().rows.map((row) => row.original)
    onSelectionChange(selected)
  }, [onSelectionChange, rowSelection, table])

  return (
    <div className="space-y-2">
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/60 hover:bg-muted/60 border-b-2 border-border"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-foreground font-semibold text-xs"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("No articles found.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
