import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer"
import type { Order } from "@/types/order"

const BUSINESS_NAME = "Liszt Rapszodia"
const BUSINESS_EMAIL = "order@lisztrapszodia.in.rs"

/** Noto Sans (LGC) — full Latin Extended for č, ć, é, etc. Bundled under public/fonts (OFL). */
const RECEIPT_FONT_FAMILY = "NotoSans"

let receiptFontsRegistered = false

function absolutePublicUrl(relativePath: string): string {
  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`
  if (typeof window === "undefined") return path
  const base = import.meta.env.BASE_URL
  const prefix = base === "/" ? "" : base.replace(/\/$/, "")
  return `${window.location.origin}${prefix}${path}`
}

export function registerReceiptFonts(): void {
  if (receiptFontsRegistered || typeof window === "undefined") return
  Font.register({
    family: RECEIPT_FONT_FAMILY,
    fonts: [
      {
        src: absolutePublicUrl("fonts/NotoSans-Regular.ttf"),
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: absolutePublicUrl("fonts/NotoSans-Bold.ttf"),
        fontWeight: 700,
        fontStyle: "normal",
      },
    ],
  })
  receiptFontsRegistered = true
}

/** Native `public/logo.png` size — slot keeps this aspect ratio (581:540). */
const LOGO_NATIVE_W = 581
const LOGO_NATIVE_H = 540
const LOGO_ASPECT = LOGO_NATIVE_W / LOGO_NATIVE_H
/** Header logo height in pt; width follows aspect ratio. */
const LOGO_SLOT_HEIGHT_PT = 66
const LOGO_SLOT_WIDTH_PT = LOGO_SLOT_HEIGHT_PT * LOGO_ASPECT

export type ReceiptPdfLabels = {
  title: string
  billTo: string
  recipient: string
  orderedArticles: string
  item: string
  qty: string
  amount: string
  total: string
  orderRef: string
  date: string
  phone: string
  location: string
  remark: string
  articlesFallback: string
}

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontFamily: RECEIPT_FONT_FAMILY,
    fontWeight: 400,
    color: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoSlot: {
    width: LOGO_SLOT_WIDTH_PT,
    height: LOGO_SLOT_HEIGHT_PT,
    marginRight: 14,
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "left center",
  },
  brandText: {
    flexDirection: "column",
  },
  businessName: {
    fontSize: 14,
    fontFamily: RECEIPT_FONT_FAMILY,
    fontWeight: 700,
    marginBottom: 4,
  },
  businessEmail: {
    fontSize: 9,
    color: "#555",
  },
  receiptTitle: {
    fontSize: 11,
    fontFamily: RECEIPT_FONT_FAMILY,
    fontWeight: 700,
    textAlign: "right",
    marginBottom: 4,
  },
  receiptMeta: {
    fontSize: 9,
    color: "#555",
    textAlign: "right",
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: RECEIPT_FONT_FAMILY,
    fontWeight: 700,
    color: "#666",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  customerBlock: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  customerLine: {
    marginBottom: 4,
    fontSize: 10,
  },
  customerStrong: {
    fontFamily: RECEIPT_FONT_FAMILY,
    fontWeight: 700,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  colItem: { flex: 1, paddingRight: 8 },
  colQty: { width: 36, textAlign: "right" },
  colAmt: {
    width: 72,
    textAlign: "right",
    fontFamily: RECEIPT_FONT_FAMILY,
    fontWeight: 700,
  },
  headerCell: {
    fontSize: 8,
    fontFamily: RECEIPT_FONT_FAMILY,
    fontWeight: 700,
    color: "#666",
    textTransform: "uppercase",
  },
  totalRow: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  totalLine: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-end",
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: RECEIPT_FONT_FAMILY,
    fontWeight: 700,
    marginRight: 12,
    textAlign: "right",
  },
  totalValue: {
    fontSize: 13,
    fontFamily: RECEIPT_FONT_FAMILY,
    fontWeight: 700,
    width: 72,
    textAlign: "right",
  },
  remarkBlock: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 4,
  },
  remarkLabel: {
    fontSize: 8,
    fontFamily: RECEIPT_FONT_FAMILY,
    fontWeight: 700,
    color: "#92400e",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  fallbackText: {
    fontSize: 9,
    color: "#444",
    lineHeight: 1.4,
  },
  footerNote: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
  },
})

function formatRsd(n: number) {
  return `${n.toLocaleString("sr-Latn-RS")} RSD`
}

export function OrderReceiptDocument({
  order,
  labels,
  logoSrc,
}: {
  order: Order
  labels: ReceiptPdfLabels
  logoSrc: string
}) {
  const items = order.orderedArticlesParsed

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandBlock}>
            <View style={styles.logoSlot}>
              <Image src={logoSrc} style={styles.logo} />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.businessName}>{BUSINESS_NAME}</Text>
              <Text style={styles.businessEmail}>{BUSINESS_EMAIL}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.receiptTitle}>{labels.title}</Text>
            <Text style={styles.receiptMeta}>
              {labels.orderRef}: {order.orderId}
            </Text>
            <Text style={styles.receiptMeta}>
              {labels.date}: {order.date}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{labels.billTo}</Text>
        <View style={styles.customerBlock}>
          <Text style={styles.customerLine}>
            <Text style={styles.customerStrong}>{labels.recipient}: </Text>
            {order.recipient}
          </Text>
          <Text style={styles.customerLine}>
            <Text style={styles.customerStrong}>{labels.phone}: </Text>
            {order.phone}
          </Text>
          <Text style={styles.customerLine}>
            <Text style={styles.customerStrong}>{labels.location}: </Text>
            {order.location}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>{labels.orderedArticles}</Text>

        {items.length > 0 ? (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.colItem, styles.headerCell]}>
                {labels.item}
              </Text>
              <Text style={[styles.colQty, styles.headerCell]}>
                {labels.qty}
              </Text>
              <Text style={[styles.colAmt, styles.headerCell]}>
                {labels.amount}
              </Text>
            </View>
            {items.map((line, i) => (
              <View key={i} style={styles.tableRow} wrap={false}>
                <Text style={styles.colItem}>{line.name}</Text>
                <Text style={styles.colQty}>{line.quantity}</Text>
                <Text style={styles.colAmt}>{formatRsd(line.price)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.fallbackText}>
            {order.orderedArticlesRaw?.trim()
              ? order.orderedArticlesRaw
              : labels.articlesFallback}
          </Text>
        )}

        <View style={styles.totalRow}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>{labels.total}</Text>
            <Text style={styles.totalValue}>
              {formatRsd(order.totalPrice)}
            </Text>
          </View>
        </View>

        {order.remark ? (
          <View style={styles.remarkBlock}>
            <Text style={styles.remarkLabel}>{labels.remark}</Text>
            <Text style={styles.fallbackText}>{order.remark}</Text>
          </View>
        ) : null}

        <Text style={styles.footerNote} fixed>
          {BUSINESS_NAME} · {BUSINESS_EMAIL}
        </Text>
      </Page>
    </Document>
  )
}

export function getReceiptLogoSrc(): string {
  if (typeof window === "undefined") return "/logo.png"
  return new URL("/logo.png", window.location.origin).href
}

export async function downloadOrderReceiptPdf(
  order: Order,
  labels: ReceiptPdfLabels
): Promise<void> {
  registerReceiptFonts()
  const logoSrc = getReceiptLogoSrc()
  const blob = await pdf(
    <OrderReceiptDocument order={order} labels={labels} logoSrc={logoSrc} />
  ).toBlob()

  const safeId = order.orderId.replace(/[^\w.-]+/g, "_")
  const filename = `receipt-${safeId}.pdf`

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
