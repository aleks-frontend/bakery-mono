import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusDropdown } from "./StatusDropdown";
import type { Order, OrderStatus, OrdersListParams } from "@bakery/api-client";
import { Archive, ArchiveRestore, ArrowUpDown, Eye, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpdateOrderMutation } from "@/hooks/useUpdateOrderMutation";

type SortableColumn = NonNullable<OrdersListParams["sortBy"]>;

interface OrdersTableProps {
  orders: Order[];
  sortBy: SortableColumn;
  sortDir: "asc" | "desc";
  onSortChange: (sortBy: SortableColumn) => void;
  onViewDetails: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onToggleArchive: (order: Order) => void;
  onSelectionChange?: (selectedOrders: Order[]) => void;
}

function SelectCheckbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={ariaLabel}
      className="h-4 w-4 rounded border-border accent-primary"
    />
  );
}

function SortableHeader({
  label,
  column,
  sortBy,
  sortDir,
  onSortChange,
}: {
  label: string;
  column: SortableColumn;
  sortBy: SortableColumn;
  sortDir: "asc" | "desc";
  onSortChange: (sortBy: SortableColumn) => void;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => onSortChange(column)}
      className="h-8 px-2 text-xs font-semibold"
    >
      {label}
      <ArrowUpDown className={sortBy === column ? "ml-2 h-4 w-4 opacity-100" : "ml-2 h-4 w-4 opacity-40"} />
      {sortBy === column && (
        <span className="sr-only">{sortDir === "asc" ? "ascending" : "descending"}</span>
      )}
    </Button>
  );
}

export function OrdersTable({
  orders,
  sortBy,
  sortDir,
  onSortChange,
  onViewDetails,
  onDeleteOrder,
  onToggleArchive,
  onSelectionChange,
}: OrdersTableProps) {
  const { t } = useTranslation();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { mutate: updateOrder } = useUpdateOrderMutation();

  const handleStatusChange = useCallback(
    (orderId: string, status: OrderStatus) => {
      setUpdatingOrderId(orderId);
      updateOrder({ id: orderId, input: { status } }, { onSettled: () => setUpdatingOrderId(null) });
    },
    [updateOrder]
  );

  const columns: ColumnDef<Order>[] = useMemo(
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
              ariaLabel={t("Select order")}
            />
          </div>
        ),
      },
      {
        accessorKey: "recipient",
        header: () => (
          <SortableHeader
            label={t("Recipient")}
            column="recipient"
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={onSortChange}
          />
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("recipient")}</div>,
      },
      {
        accessorKey: "phone",
        header: t("Phone"),
        cell: ({ row }) => <div>{row.getValue("phone")}</div>,
      },
      {
        id: "date",
        header: () => (
          <SortableHeader
            label={t("Date")}
            column="createdAt"
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={onSortChange}
          />
        ),
        cell: ({ row }) => <div>{row.original.createdAt.toLocaleDateString()}</div>,
      },
      {
        accessorKey: "location",
        header: t("Location"),
        cell: ({ row }) => <div>{row.getValue("location")}</div>,
      },
      {
        accessorKey: "totalPrice",
        header: () => (
          <SortableHeader
            label={t("Total Price")}
            column="totalPrice"
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={onSortChange}
          />
        ),
        cell: ({ row }) => {
          const price = row.getValue("totalPrice") as number;
          return (
            <div className="font-medium">
              {price} {t("RSD")}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("Status"),
        cell: ({ row }) => {
          const order = row.original;
          return (
            <StatusDropdown
              currentStatus={order.status}
              onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)}
              disabled={updatingOrderId === order.id}
            />
          );
        },
      },
      {
        id: "actions",
        header: t("Actions"),
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => onViewDetails(order)}>
                <Eye className="h-4 w-4 mr-2" />
                {t("View details")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onToggleArchive(order)}
                title={order.archived ? t("Unarchive Order") : t("Archive Order")}
              >
                {order.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDeleteOrder(order)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [t, sortBy, sortDir, onSortChange, onViewDetails, onDeleteOrder, onToggleArchive, handleStatusChange, updatingOrderId]
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    state: { rowSelection },
  });

  useEffect(() => {
    if (!onSelectionChange) return;
    const selectedOrders = table.getSelectedRowModel().rows.map((row) => row.original);
    onSelectionChange(selectedOrders);
  }, [onSelectionChange, rowSelection, table]);

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
                {t("No orders found.")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
