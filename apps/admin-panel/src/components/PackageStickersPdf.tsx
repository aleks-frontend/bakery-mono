import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"
import type { Order } from "@bakery/api-client"
import { registerReceiptFonts } from "@/components/OrderReceiptPdf"

export type PackageStickersPdfLabels = {
  title: string
  total: string
  noArticles: string
}

const STICKER_FONT_FAMILY = "NotoSans"

const styles = StyleSheet.create({
  page: {
    fontSize: 8,
    padding: 0,
    fontFamily: STICKER_FONT_FAMILY,
    color: "#111827",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sticker: {
    width: "33.33%",
    padding: 0,
  },
  stickerInner: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 1,
  },
  customerName: {
    fontSize: 9.5,
    fontWeight: 700,
    lineHeight: 1.2,
    flex: 1,
    paddingRight: 4,
  },
  phoneInline: {
    fontSize: 7,
    fontWeight: 400,
    color: "#4b5563",
  },
  orderId: {
    fontSize: 6.5,
    color: "#9ca3af",
    lineHeight: 1.2,
    paddingTop: 1,
  },
  location: {
    fontSize: 7.5,
    color: "#4b5563",
    lineHeight: 1.2,
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    marginBottom: 2,
  },
  articleLine: {
    fontSize: 7.5,
    lineHeight: 1.2,
  },
  rawArticles: {
    fontSize: 7,
    color: "#374151",
    lineHeight: 1.2,
  },
  noArticlesText: {
    fontSize: 7.5,
    color: "#9ca3af",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 2,
    paddingTop: 2,
    borderTopWidth: 0.5,
    borderTopColor: "#d1d5db",
  },
  totalLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#374151",
  },
  totalValue: {
    fontSize: 9.5,
    fontWeight: 700,
  },
  remarkText: {
    fontSize: 7,
    color: "#92400e",
    marginTop: 1,
    lineHeight: 1.2,
  },
})

function formatRsd(n: number): string {
  return `${n.toLocaleString("sr-Latn-RS")} RSD`
}

function formatFilenameDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function Sticker({
  order,
  labels,
}: {
  order: Order
  labels: PackageStickersPdfLabels
}) {
  const items = order.items ?? []

  return (
    <View style={styles.sticker} wrap={false}>
      <View style={styles.stickerInner}>
        <View style={styles.headerRow}>
          <Text style={styles.customerName}>
            {order.recipient}
            {order.phone ? (
              <Text style={styles.phoneInline}> ({order.phone})</Text>
            ) : ""}
          </Text>
          <Text style={styles.orderId}>{order.id}</Text>
        </View>

        {order.location ? (
          <Text style={styles.location}>{order.location}</Text>
        ) : null}

        <View style={styles.divider} />

        {items.length > 0 ? (
          items.map((item) => (
            <Text key={item.id} style={styles.articleLine}>
              • {item.article?.name ?? item.articleId} × {item.quantity}
            </Text>
          ))
        ) : (
          <Text style={styles.noArticlesText}>{labels.noArticles}</Text>
        )}

        {order.remark ? (
          <Text style={styles.remarkText}>* {order.remark}</Text>
        ) : null}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{labels.total}:</Text>
          <Text style={styles.totalValue}>{formatRsd(order.totalPrice)}</Text>
        </View>
      </View>
    </View>
  )
}

export function PackageStickersDocument({
  orders,
  labels,
}: {
  orders: Order[]
  labels: PackageStickersPdfLabels
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.grid}>
          {orders.map((order) => (
            <Sticker key={order.id} order={order} labels={labels} />
          ))}
        </View>
      </Page>
    </Document>
  )
}

export async function downloadPackageStickersPdf(
  orders: Order[],
  labels: PackageStickersPdfLabels,
): Promise<void> {
  registerReceiptFonts()
  const blob = await pdf(
    <PackageStickersDocument orders={orders} labels={labels} />,
  ).toBlob()

  const filename = `package-stickers-${formatFilenameDate(new Date())}.pdf`
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
