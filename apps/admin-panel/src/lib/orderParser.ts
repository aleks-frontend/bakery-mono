import { ParsedOrderItem } from "@/types/order"

/**
 * Parses ordered articles string into structured data
 * 
 * Example input:
 * "• Crni hleb × 5 = 2500 RSD\n• Beli hleb × 10 = 5000 RSD"
 * 
 * Output:
 * [
 *   { name: "Crni hleb", quantity: 5, price: 2500 },
 *   { name: "Beli hleb", quantity: 10, price: 5000 }
 * ]
 */
export function parseOrderedArticles(raw: string): ParsedOrderItem[] {
  if (!raw || !raw.trim()) {
    return []
  }

  const lines = raw.split("\n").filter((line) => line.trim())
  const items: ParsedOrderItem[] = []

  for (const line of lines) {
    // Remove bullet point if present
    const cleaned = line.replace(/^[•\-*]\s*/, "").trim()
    
    // Pattern: "Item name × quantity = price RSD"
    // Example: "Crni hleb × 5 = 2500 RSD"
    const match = cleaned.match(/^(.+?)\s*×\s*(\d+)\s*=\s*(\d+)\s*(?:RSD)?$/i)
    
    if (match) {
      const [, name, quantityStr, priceStr] = match
      const quantity = parseInt(quantityStr, 10)
      const price = parseInt(priceStr, 10)
      
      if (!isNaN(quantity) && !isNaN(price)) {
        items.push({
          name: name.trim(),
          quantity,
          price,
        })
      }
    }
  }

  return items
}
