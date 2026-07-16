import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer"
import type { Order } from "@bakery/api-client"
import { registerReceiptFonts } from "@/components/OrderReceiptPdf"

export type WorkshopListPdfLabels = {
  title: string
  generatedAt: string
  total: string
  noArticles: string
  unparsedLines: string
}

const WORKSHOP_FONT_FAMILY = "NotoSans"

const styles = StyleSheet.create({
  page: {
    fontSize: 8.5,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
    fontFamily: WORKSHOP_FONT_FAMILY,
    color: "#111827",
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
    lineHeight: 1.2,
  },
  meta: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 4,
    lineHeight: 1.2,
  },
  articleBlock: {
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  articleHead: {
    fontSize: 9,
    lineHeight: 1.25,
    marginBottom: 1,
  },
  articleNameStrong: {
    fontWeight: 700,
  },
  totalLine: {
    marginTop: 1,
    fontWeight: 700,
    fontSize: 8.5,
    lineHeight: 1.2,
  },
  unparsedHeader: {
    marginTop: 6,
    marginBottom: 2,
    fontWeight: 700,
    fontSize: 9,
    lineHeight: 1.2,
  },
  unparsedLine: {
    marginBottom: 1,
    color: "#6b7280",
    lineHeight: 1.2,
    fontSize: 8,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 8.5,
  },
})

/**
 * Article names embed their pack weight as a trailing "NNNg" (optionally
 * preceded by "~"), e.g. "Beli hleb - Fehér kenyér - 500g" or
 * "Focaccia - ~800g". Extracts the base name and gram size from that suffix.
 */
function parseArticleNameWeight(name: string): { baseName: string; gramsPerUnit: number } | null {
  const re = /^([\s\S]*?)[\s\-–—]*~?\s*(\d+)\s*g\s*$/u
  const m = name.trim().match(re)
  if (!m) return null

  const baseName = m[1].replace(/[\s\-–—]+$/, "").trim()
  const gramsPerUnit = parseInt(m[2], 10)
  if (!baseName || Number.isNaN(gramsPerUnit)) return null

  return { baseName, gramsPerUnit }
}

type WorkshopArticleSummary = {
  name: string
  /** gram size -> summed quantity (number of packs) */
  gramsToQty: Map<number, number>
  totalGrams: number
}

/** Build ordered summaries from all orders' items: first-seen name order; gram variants sorted ascending. */
function summarizeWorkshopArticlesFromOrders(orders: Order[]): {
  summaries: WorkshopArticleSummary[]
  unparsedLines: string[]
} {
  const unparsedLines: string[] = []
  /** name -> Map<gramsPerUnit, totalQty> */
  const byName = new Map<string, Map<number, number>>()
  const nameOrder: string[] = []

  for (const order of orders) {
    for (const item of order.items ?? []) {
      const articleName = item.article?.name ?? item.articleId
      const parsed = parseArticleNameWeight(articleName)
      if (!parsed) {
        unparsedLines.push(`${articleName} × ${item.quantity}`)
        continue
      }
      let gmap = byName.get(parsed.baseName)
      if (!gmap) {
        gmap = new Map()
        byName.set(parsed.baseName, gmap)
        nameOrder.push(parsed.baseName)
      }
      gmap.set(parsed.gramsPerUnit, (gmap.get(parsed.gramsPerUnit) ?? 0) + item.quantity)
    }
  }

  const summaries: WorkshopArticleSummary[] = nameOrder.map((name) => {
    const gmap = byName.get(name)!
    let totalGrams = 0
    for (const [grams, qty] of gmap) {
      totalGrams += grams * qty
    }
    return { name, gramsToQty: gmap, totalGrams }
  })

  return { summaries, unparsedLines }
}

function formatKgParenthesis(totalGrams: number): string {
  if (totalGrams % 1000 === 0) return `${totalGrams / 1000}kg`
  const kg = totalGrams / 1000
  let s = kg.toFixed(2)
  s = s.replace(/\.?0+$/, "")
  return `${s}kg`
}

function formatGeneratedAt(value: Date): string {
  return value.toLocaleString("sr-Latn-RS")
}

function formatFilenameDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function WorkshopListDocument({
  orders,
  labels,
  generatedAt,
}: {
  orders: Order[]
  labels: WorkshopListPdfLabels
  generatedAt: Date
}) {
  const { summaries, unparsedLines } = summarizeWorkshopArticlesFromOrders(orders)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{labels.title}</Text>
        <Text style={styles.meta}>
          {labels.generatedAt}: {formatGeneratedAt(generatedAt)}
        </Text>

        {summaries.length === 0 ? (
          <Text style={styles.emptyText}>{labels.noArticles}</Text>
        ) : (
          summaries.map((summary) => {
            const gramSizes = [...summary.gramsToQty.keys()].sort((a, b) => a - b)
            const variantsJoined = gramSizes
              .map((grams) => {
                const qty = summary.gramsToQty.get(grams) ?? 0
                return `${grams}g x ${qty}`
              })
              .join(", ")
            return (
              <View key={summary.name} style={styles.articleBlock}>
                <Text style={styles.articleHead}>
                  <Text style={styles.articleNameStrong}>{summary.name}: </Text>
                  {variantsJoined}
                </Text>
                <Text style={styles.totalLine}>
                  {labels.total}: {summary.totalGrams}g ({formatKgParenthesis(summary.totalGrams)})
                </Text>
              </View>
            )
          })
        )}

        {unparsedLines.length > 0 ? (
          <View>
            <Text style={styles.unparsedHeader}>{labels.unparsedLines}</Text>
            {unparsedLines.map((line, i) => (
              <Text key={i} style={styles.unparsedLine}>
                - {line}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  )
}

export async function downloadWorkshopListPdf(
  orders: Order[],
  labels: WorkshopListPdfLabels,
): Promise<void> {
  registerReceiptFonts()
  const generatedAt = new Date()
  const blob = await pdf(
    <WorkshopListDocument
      orders={orders}
      labels={labels}
      generatedAt={generatedAt}
    />,
  ).toBlob()

  const filename = `workshop-list-${formatFilenameDate(generatedAt)}.pdf`
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
