import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useArticlesQuery } from "@/hooks/useArticlesQuery"
import { useUpdateArticleAvailabilityMutation } from "@/hooks/useUpdateArticleMutation"
import { useDeleteArticleMutation } from "@/hooks/useDeleteArticleMutation"
import { ArticlesTable } from "@/components/ArticlesTable"
import { ArticleModal } from "@/components/ArticleModal"
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal"
import type { ArticleWithAvailability } from "@bakery/api-client"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { BulkPanel } from "@/components/BulkPanel"
import { Plus, Search, Trash2, X } from "lucide-react"

export function ArticlesPage() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useArticlesQuery()
  const articles = useMemo(() => data ?? [], [data])
  const availabilityMutation = useUpdateArticleAvailabilityMutation()
  const deleteMutation = useDeleteArticleMutation()

  const [selectedArticle, setSelectedArticle] = useState<ArticleWithAvailability | undefined>()
  const [selectedArticles, setSelectedArticles] = useState<ArticleWithAvailability[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [idsToDelete, setIdsToDelete] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all")
  const [bulkAvailability, setBulkAvailability] = useState<"" | "true" | "false">("")

  const handleBulkAvailabilityChange = (value: "true" | "false") => {
    setBulkAvailability(value)
    availabilityMutation.mutate({
      ids: selectedArticles.map((a) => a.id),
      available: value === "true",
    })
  }

  const filtered = useMemo(() => {
    let result = articles

    if (availabilityFilter === "available") {
      result = result.filter((a) => a.available)
    } else if (availabilityFilter === "unavailable") {
      result = result.filter((a) => !a.available)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((a) => a.name.toLowerCase().includes(q))
    }

    return result
  }, [articles, availabilityFilter, searchQuery])

  const handleViewDetails = (article: ArticleWithAvailability) => {
    setSelectedArticle(article)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setSelectedArticle(undefined)
    setIsModalOpen(true)
  }

  const handleDeleteArticle = (article: ArticleWithAvailability) => {
    setIdsToDelete([article.id])
    setDeleteConfirmOpen(true)
  }

  const handleBulkDelete = () => {
    setIdsToDelete(selectedArticles.map((a) => a.id))
    setDeleteConfirmOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("Loading articles...")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive font-medium mb-2">{t("Error loading articles")}</p>
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
          <h1 className="text-3xl font-bold tracking-tight">{t("Articles")}</h1>
          <p className="text-muted-foreground">{t("Manage articles and availability")}</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          {t("Add Article")}
        </Button>
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
            {t("Showing {{count}} of {{total}} articles", {
              count: filtered.length,
              total: articles.length,
            })}
          </p>
        </div>
        <ArticlesTable
          articles={filtered}
          onViewDetails={handleViewDetails}
          onDeleteArticle={handleDeleteArticle}
          onSelectionChange={setSelectedArticles}
        />
      </div>

      <BulkPanel count={selectedArticles.length}>
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

      <ArticleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        article={selectedArticle}
      />

      <DeleteConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        ids={idsToDelete}
        entitySingular={t("article")}
        entityPlural={t("articles")}
        onDelete={(ids) => deleteMutation.mutateAsync(ids).then(() => {})}
      />
    </div>
  )
}
