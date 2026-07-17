import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
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
import type { RepeatingOrder } from "@bakery/api-client"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

interface RepeatingOrdersTableProps {
  repeatingOrders: RepeatingOrder[]
  onEdit: (repeatingOrder: RepeatingOrder) => void
  onDelete: (repeatingOrder: RepeatingOrder) => void
  onSelectionChange?: (selected: RepeatingOrder[]) => void
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

function itemsSummary(repeatingOrder: RepeatingOrder): string {
  const items = repeatingOrder.items ?? []
  if (items.length === 0) return "—"
  return items.map((item) => `${item.article?.name ?? item.articleId} ×${item.quantity}`).join(", ")
}

export function RepeatingOrdersTable({
  repeatingOrders,
  onEdit,
  onDelete,
  onSelectionChange,
}: RepeatingOrdersTableProps) {
  const { t } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const columns: ColumnDef<RepeatingOrder>[] = useMemo(
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
              ariaLabel={t("Select repeating order")}
            />
          </div>
        ),
      },
      {
        accessorKey: "recipient",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 text-xs font-semibold"
          >
            {t("Recipient")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("recipient")}</div>,
      },
      {
        accessorKey: "phone",
        header: t("Phone"),
        cell: ({ row }) => <div>{row.getValue("phone")}</div>,
      },
      {
        accessorKey: "location",
        header: t("Location"),
        cell: ({ row }) => <div>{row.getValue("location")}</div>,
      },
      {
        id: "items",
        header: t("Ordered Articles"),
        cell: ({ row }) => (
          <div className="max-w-xs truncate text-muted-foreground" title={itemsSummary(row.original)}>
            {itemsSummary(row.original)}
          </div>
        ),
      },
      {
        id: "actions",
        header: t("Actions"),
        cell: ({ row }) => {
          const repeatingOrder = row.original
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(repeatingOrder)}>
                <Pencil className="h-4 w-4 mr-2" />
                {t("Edit")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(repeatingOrder)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        },
      },
    ],
    [t, onEdit, onDelete]
  )

  const table = useReactTable({
    data: repeatingOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/60 hover:bg-muted/60 border-b-2 border-border">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-foreground font-semibold text-xs">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {t("No repeating orders found.")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
