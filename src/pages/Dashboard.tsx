"use client"

import { useEffect, useState } from "react"
import {
  DollarSign,
  BarChart2,
  MessageSquare,
  Link,
  Facebook,
  Play,
  Target,
  Tag,
  BookmarkCheck,
  Calendar,
  ChevronDown,
  Lock,
  Bookmark,
  Search,
  X,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

// Update the PRODUCTS_PER_PAGE constant from 20 to 10
const PRODUCTS_PER_PAGE = 10

const Dashboard = () => {
  const navigate = useNavigate()
  const [showSaved, setShowSaved] = useState(false)
  const [dateRange, setDateRange] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [savedProducts, setSavedProducts] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("new") // new, trending, profit
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [userSubscription, setUserSubscription] = useState("free") // Default to free

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const fetchUserSubscription = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: customer, error } = await supabase
          .from("customers")
          .select("subscription_tier")
          .eq("user_id", user.id)
          .single()

        if (!error && customer) {
          setUserSubscription(customer.subscription_tier)
        }
      }
    }

    fetchUserSubscription()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError)
      } else {
        setCategories(categoriesData || [])
      }

      // Fetch saved products
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: savedProductsData, error: savedProductsError } = await supabase
          .from("saved_products")
          .select("product_id")
          .eq("user_id", user.id)

        if (savedProductsError) {
          console.error("Error fetching saved products:", savedProductsError)
        } else {
          setSavedProducts(new Set(savedProductsData.map((item) => item.product_id)))
        }
      }

      try {
        // Build the base query for products
        let query = supabase.from("products").select("*", { count: "exact" })

        // Apply search filter if searchQuery is not empty
        if (debouncedSearchQuery.trim()) {
          query = query.ilike("name", `%${debouncedSearchQuery}%`)
        }

        // Apply date range filter
        if (dateRange !== "all") {
          const now = new Date()
          const startDate = new Date()

          switch (dateRange) {
            case "today":
              startDate.setHours(0, 0, 0, 0) // Start of today
              break
            case "week":
              startDate.setDate(now.getDate() - 7) // 7 days ago
              break
            case "month":
              startDate.setMonth(now.getMonth() - 1) // 1 month ago
              break
            case "quarter":
              startDate.setMonth(now.getMonth() - 3) // 3 months ago
              break
          }

          query = query.gte("created_at", startDate.toISOString())
        }

        // Apply sorting
        switch (sortBy) {
          case "new":
            query = query.order("created_at", { ascending: false })
            break
          case "trending":
            // For trending, we might sort by views or some popularity metric
            query = query.order("views", { ascending: false })
            break
          case "profit":
            query = query.order("profit_margin", { ascending: false })
            break
        }

        // We want to show all products to all users, but with different button text
        // No filtering needed here - we'll handle access control at the UI level

        // Apply pagination
        const from = (currentPage - 1) * PRODUCTS_PER_PAGE
        const to = from + PRODUCTS_PER_PAGE - 1
        query = query.range(from, to)

        // Execute the query
        const { data: productsData, error: productsError, count } = await query

        if (productsError) {
          throw productsError
        }

        // Set total count and calculate total pages
        if (count !== null) {
          setTotalCount(count)
          setTotalPages(Math.ceil(count / PRODUCTS_PER_PAGE))
        }

        // If a category is selected, filter the products after fetching
        let filteredProducts = productsData || []

        if (selectedCategory !== "all") {
          // Get all product_categories entries for the selected category
          const { data: categoryProducts, error: categoryError } = await supabase
            .from("product_categories")
            .select("product_id")
            .eq("category_id", selectedCategory)

          if (categoryError) {
            throw categoryError
          }

          // Extract product IDs that belong to the selected category
          const productIds = categoryProducts.map((item) => item.product_id)

          // Filter products to only include those in the selected category
          filteredProducts = filteredProducts.filter((product) => productIds.includes(product.id))
        }

        // If we're showing saved products, filter the results
        if (showSaved) {
          filteredProducts = filteredProducts.filter((product: any) => savedProducts.has(product.id))
        }

        // Set the filtered products
        // setProducts(filteredProducts)

        // Add the following logic to automatically lock products beyond page 2 for free users:
        if (userSubscription !== "pro") {
          // Calculate which products should be locked based on pagination
          const productsPerPage = PRODUCTS_PER_PAGE
          const maxUnlockedProducts = productsPerPage * 2 // 2 pages worth of products

          // Mark products as locked if they would appear beyond page 2
          const productsWithLockStatus = filteredProducts.map((product: any, index: number) => {
            // Get the product's position in the overall sorted list
            const productPosition = from + index

            // If the product would appear beyond page 2, mark it as locked for free users
            if (productPosition >= maxUnlockedProducts) {
              return {
                ...product,
                is_locked: true,
                auto_locked: true, // Add a flag to indicate this was automatically locked
              }
            }

            return product
          })

          setProducts(productsWithLockStatus)
        } else {
          // Pro users can see all products
          setProducts(filteredProducts)
        }
      } catch (error) {
        console.error("Error fetching and filtering products:", error)
      }
    }

    fetchData()
  }, [
    selectedCategory,
    debouncedSearchQuery,
    dateRange,
    sortBy,
    showSaved,
    savedProducts,
    currentPage,
    userSubscription,
  ])

  const toggleSaveProduct = async (productId: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      if (savedProducts.has(productId)) {
        // Remove from saved products
        const { error } = await supabase
          .from("saved_products")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)

        if (error) {
          console.error("Error removing saved product:", error)
        } else {
          setSavedProducts((prev) => {
            const newSet = new Set(prev)
            newSet.delete(productId)
            return newSet
          })
        }
      } else {
        // Add to saved products
        const { error } = await supabase.from("saved_products").insert({ user_id: user.id, product_id: productId })

        if (error) {
          console.error("Error saving product:", error)
        } else {
          setSavedProducts((prev) => new Set(prev).add(productId))
        }
      }
    }
  }

  const handleShowMeMoney = (productId: number, isLocked: boolean, isTopProduct: boolean, autoLocked: boolean) => {
    // If the product is locked (either manually or automatically) and user is not pro, redirect to pricing
    if ((isLocked || isTopProduct || autoLocked) && userSubscription !== "pro") {
      navigate("/pricing")
    } else {
      // Otherwise, navigate to the product details
      navigate(`/product/${productId}`)
    }
  }

  const getPaginationRange = () => {
    const range = []
    const showPages = 5
    const leftOffset = Math.floor(showPages / 2)

    let start = currentPage - leftOffset
    let end = currentPage + leftOffset

    if (start < 1) {
      end += 1 - start
      start = 1
    }

    if (end > totalPages) {
      start -= end - totalPages
      end = totalPages
    }

    start = Math.max(start, 1)
    end = Math.min(end, totalPages)

    if (start > 1) {
      range.push(1)
      if (start > 2) range.push("...")
    }

    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) range.push("...")
      range.push(totalPages)
    }

    return range
  }

  return (
    <div className="max-w-7xl mx-auto pt-20">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Curated Winning Products, Updated Every Day</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for products, niches, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filters Toggle */}
        <button
          className="md:hidden flex items-center justify-between w-full px-4 py-2 bg-white border rounded-lg"
          onClick={() => setShowFilters(!showFilters)}
        >
          <span className="text-gray-700 font-medium">Filters</span>
          <ChevronDown
            size={20}
            className={`text-gray-500 transform transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>

        {/* Filters */}
        <div
          className={`
          flex flex-col gap-3
          md:flex md:flex-row md:items-center md:justify-between
          ${showFilters ? "block" : "hidden md:flex"}
        `}
        >
          {/* Left Side - My Saved */}
          <button
            onClick={() => navigate("/saved-products")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors w-full md:w-auto ${
              showSaved ? "bg-secondary text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <BookmarkCheck size={18} />
            <span className="whitespace-nowrap">My Saved</span>
          </button>

          {/* Right Side - Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <select
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="new">Sort by: New</option>
              <option value="trending">Sort by: Trending</option>
              <option value="profit">Sort by: Profit</option>
            </select>

            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2">
              <Calendar size={18} className="text-gray-500 shrink-0" />
              <select
                className="w-full bg-transparent border-none text-sm font-medium focus:outline-none"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">Last 3 Months</option>
              </select>
            </div>

            <select
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {products.length > 0 ? (
          products.map((product: any) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex h-[180px]">
                {/* Product Image */}
                <div className="relative w-[180px] shrink-0">
                  <img
                    src={product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {(product.is_locked || product.is_top_product || product.auto_locked) &&
                    (userSubscription !== "pro" ||
                      (product.release_time && new Date(product.release_time) > new Date())) && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                        <Lock size={24} className="text-white mb-1" />
                        {product.release_time && new Date(product.release_time) > new Date() && (
                          <div className="text-white text-xs text-center px-2">
                            <div>Available in</div>
                            <div className="font-bold">
                              {(() => {
                                const timeRemaining = new Date(product.release_time).getTime() - new Date().getTime()
                                const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
                                const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                                const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
                                const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)

                                return (
                                  <>
                                    {days > 0 && `${days}d `}
                                    {hours > 0 && `${hours}h `}
                                    {minutes > 0 && `${minutes}m `}
                                    {seconds}s
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        )}
                        {(product.is_top_product || product.auto_locked) && (
                          <div className="text-white text-xs text-center px-2 mt-1">
                            <div>Pro members only</div>
                          </div>
                        )}
                      </div>
                    )}
                  {product.is_top_product && (
                    <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      Top Pick
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 p-4 flex flex-col">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-gray-500">
                        Posted{" "}
                        {Math.floor((Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                        ago
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { icon: DollarSign, label: "PROFITS", color: "text-green-600" },
                      { icon: BarChart2, label: "ANALYTICS", color: "text-orange-500" },
                      { icon: MessageSquare, label: "ENGAGEMENT", color: "text-blue-500" },
                      { icon: Link, label: "LINKS", color: "text-purple-500" },
                      { icon: Facebook, label: "FB ADS", color: "text-blue-600" },
                      { icon: Play, label: "VIDEO", color: "text-red-500" },
                      { icon: Target, label: "TARGETING", color: "text-indigo-500" },
                      { icon: Tag, label: "RETAIL PRICE", color: "text-yellow-600" },
                    ].map((stat, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center justify-center p-2 bg-gray-50/80 rounded hover:bg-gray-100/80 transition-colors h-[46px]"
                      >
                        <stat.icon size={20} className={`${stat.color} md:mb-1`} />
                        <span className="text-[8px] text-gray-600 font-semibold leading-none text-center uppercase tracking-wider hidden md:block">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 p-4">
                <button
                  onClick={() =>
                    handleShowMeMoney(product.id, product.is_locked, product.is_top_product, product.auto_locked)
                  }
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    product.is_locked || product.is_top_product
                      ? "bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow"
                      : "bg-secondary hover:bg-secondary/90 text-white shadow-sm hover:shadow"
                  }`}
                >
                  {product.is_top_product
                    ? "Become a Pro to Unlock"
                    : product.is_locked && product.release_time && new Date(product.release_time) > new Date()
                      ? (() => {
                          const timeRemaining = new Date(product.release_time).getTime() - new Date().getTime()
                          const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
                          const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                          const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
                          const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)

                          return `Unlock in ${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`
                        })()
                      : product.is_locked || product.auto_locked
                        ? "Become a Pro to Unlock"
                        : "Show Me The Money!"}
                </button>

                <button
                  onClick={() => toggleSaveProduct(product.id)}
                  className={`px-3 rounded-lg transition-all duration-200 ${
                    savedProducts.has(product.id)
                      ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Bookmark size={18} className={savedProducts.has(product.id) ? "fill-secondary" : ""} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center">
            <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {products.length > 0 && totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2 overflow-x-auto">
          {getPaginationRange().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-600">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(Number(page))}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === page ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>
      )}

      {/* Total Products Count */}
      <div className="text-center mt-6 text-sm text-gray-500">
        Showing {products.length} of {totalCount} products
      </div>
    </div>
  )
}

export default Dashboard

