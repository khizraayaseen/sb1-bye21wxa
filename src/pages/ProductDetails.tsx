"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ShoppingCart, Bookmark, DollarSign, ShoppingBag, Search, ExternalLink, Play, ZoomIn, Lock } from "lucide-react"
import { supabase } from "../lib/supabase"

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isSaved, setIsSaved] = useState(false)
  const [userSubscription, setUserSubscription] = useState("free") // Default to free
  const [product, setProduct] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [isLocked, setIsLocked] = useState(false)
  const [releaseTime, setReleaseTime] = useState<Date | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [addons, setAddons] = useState<any>({})
  const [addonSettings, setAddonSettings] = useState<any>({})
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const DESCRIPTION_LIMIT = 300 // Show "Read more" if text is longer than 300 characters
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const PRODUCTS_PER_PAGE = 12

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
    const fetchProduct = async () => {
      setLoading(true)

      // Fetch the product data
      const { data, error }: any = await supabase.from("products").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching product:", error.message)
        setLoading(false)
        return
      }

      // Check if product is locked for this user
      const isProductLockedInitial = data.is_locked || data.is_top_product
      const hasReleaseTime = !!data.release_time

      // Add the following logic to check if the product should be auto-locked:
      const checkAutoLock = async () => {
        if (userSubscription !== "pro") {
          // Get the total count of products
          const { count } = await supabase
            .from("products")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })

          if (count) {
            // Find the position of this product in the sorted list
            const { data: productsBeforeCurrent } = await supabase
              .from("products")
              .select("id")
              .order("created_at", { ascending: false })
              .lt("created_at", data.created_at)

            const productPosition = productsBeforeCurrent?.length || 0
            const maxUnlockedProducts = PRODUCTS_PER_PAGE * 2 // 2 pages worth of products

            // If the product would appear beyond page 2, it should be locked for free users
            if (productPosition >= maxUnlockedProducts) {
              return true
            }
          }
        }
        return false
      }

      const isAutoLocked = await checkAutoLock()
      const isProductLocked = data.is_locked || data.is_top_product || isAutoLocked

      // Set locked state based on user subscription and product properties
      if (userSubscription === "pro") {
        // Pro users can access all products
        setIsLocked(false)
      } else {
        // Free users can't access locked products or top products
        setIsLocked(isProductLocked || hasReleaseTime)

        // If product is locked and user is not pro, redirect to upgrade page
        if (isProductLocked && !hasReleaseTime) {
          navigate("/pricing")
          return
        }
      }

      // Set release time if available
      if (data.release_time) {
        setReleaseTime(new Date(data.release_time))
      }

      // Fetch categories for this product
      const { data: categoryJunctions, error: junctionError } = await supabase
        .from("product_categories")
        .select("category_id")
        .eq("product_id", id)

      if (junctionError) {
        console.error("Error fetching category junctions:", junctionError.message)
      } else if (categoryJunctions && categoryJunctions.length > 0) {
        // Get the category IDs
        const categoryIds = categoryJunctions.map((junction) => junction.category_id)

        // Fetch the actual category names
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("name")
          .in("id", categoryIds)

        if (categoryError) {
          console.error("Error fetching categories:", categoryError.message)
        } else if (categoryData) {
          // Extract just the category names
          const categoryNames = categoryData.map((cat) => cat.name)
          setCategories(categoryNames)
        }
      }

      // Fetch addons for this product
      // First try to get product-specific addons
      const { data: productSpecificAddons, error: productSpecificError } = await supabase
        .from("product_addons")
        .select("*")
        .eq("enabled", true)
        .eq("product_id", id)
        .order("order", { ascending: true })

      if (productSpecificError) {
        console.error("Error fetching product-specific addons:", productSpecificError.message)
      }

      // Then get global addons (those with null product_id)
      const { data: globalAddons, error: globalAddonsError } = await supabase
        .from("product_addons")
        .select("*")
        .eq("enabled", true)
        .is("product_id", null)
        .order("order", { ascending: true })

      if (globalAddonsError) {
        console.error("Error fetching global addons:", globalAddonsError.message)
      }

      // Combine the addons, with product-specific ones overriding global ones of the same type
      const addonData = []
      const addonTypes = new Set()

      // First add product-specific addons
      if (productSpecificAddons) {
        productSpecificAddons.forEach((addon) => {
          addonData.push(addon)
          addonTypes.add(addon.type)
        })
      }

      // Then add global addons that don't conflict with product-specific ones
      if (globalAddons) {
        globalAddons.forEach((addon) => {
          if (!addonTypes.has(addon.type)) {
            addonData.push(addon)
          }
        })
      }

      if (addonData && addonData.length > 0) {
        // Group addons by type
        const groupedAddons = {}
        const settings = {}

        addonData.forEach((addon) => {
          if (!groupedAddons[addon.type]) {
            groupedAddons[addon.type] = []
          }
          groupedAddons[addon.type].push(addon)

          // Parse content JSON for settings
          try {
            if (addon.content) {
              settings[addon.type] = JSON.parse(addon.content)
            }
          } catch (e) {
            console.error(`Error parsing addon content for ${addon.type}:`, e)
            // If parsing fails, use an empty object
            settings[addon.type] = {}
          }
        })

        setAddons(groupedAddons)
        setAddonSettings(settings)
      }

      const formattedProduct = {
        name: data.name,
        postedDays: Math.floor((Date.now() - new Date(data.created_at)) / (1000 * 60 * 60 * 24)),
        sellingPrice: data.selling_price,
        productCost: data.product_cost,
        profitMargin: Math.round(data.selling_price - data.product_cost)?.toFixed(2),
        searchVolume: {
          monthly: data.search_volume_monthly || 0,
          trend: data.search_trend || "stable",
          relatedTerms: data.related_terms || [],
        },
        estimatedSales: {
          low: data.sales_low || 0,
          average: data.sales_avg || 0,
          high: data.sales_high || 0,
        },
        description: data.description,
        specs: data.specs || [],
        images: data.images || [],
        is_locked: data.is_locked,
        is_top_product: data.is_top_product,
        release_time: data.release_time,
      }

      // Check if the product is saved
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: savedProduct, error: savedProductError } = await supabase
          .from("saved_products")
          .select()
          .eq("user_id", user.id)
          .eq("product_id", id)
          .single()

        if (savedProductError && savedProductError.code !== "PGRST116") {
          console.error("Error checking if product is saved:", savedProductError)
        } else {
          setIsSaved(!!savedProduct)
        }
      }

      setProduct(formattedProduct)
      setLoading(false)
    }

    if (id) fetchProduct()
  }, [id, userSubscription, navigate])

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZoomed) {
        setIsZoomed(false)
      }
    }

    window.addEventListener("keydown", handleEscKey)
    return () => window.removeEventListener("keydown", handleEscKey)
  }, [isZoomed])

  useEffect(() => {
    // Only set up the timer if we have a release time and the product is locked
    if (releaseTime && isLocked) {
      // Update the current time every second
      const timer = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)

      // Clean up the timer when the component unmounts
      return () => clearInterval(timer)
    }
  }, [releaseTime, isLocked])

  const calculateMonthlyRevenue = (sales: number, profitPerSale: number) => {
    const revenue = sales * profitPerSale
    return revenue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    })
  }

  const toggleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      if (isSaved) {
        // Remove from saved products
        const { error } = await supabase.from("saved_products").delete().eq("user_id", user.id).eq("product_id", id)

        if (error) {
          console.error("Error removing saved product:", error)
        } else {
          setIsSaved(false)
        }
      } else {
        // Add to saved products
        const { error } = await supabase.from("saved_products").insert({ user_id: user.id, product_id: id })

        if (error) {
          console.error("Error saving product:", error)
        } else {
          setIsSaved(true)
        }
      }
    }
  }

  // Function to extract TikTok video ID from various URL formats
  const getTikTokEmbedUrl = (url: string) => {
    try {
      // Handle different TikTok URL formats
      const patterns = [/video\/(\d+)/, /\/v\/(\d+)/, /\/t\/([^/]+)/]

      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          return `https://www.tiktok.com/embed/${match[1]}`
        }
      }

      // If no pattern matches, return the original URL
      return url
    } catch (e) {
      console.error("Error parsing TikTok URL:", e)
      return url
    }
  }

  // Parse video URLs from settings
  const getVideoUrls = () => {
    if (addonSettings.viral_videos && addonSettings.viral_videos.video_urls) {
      return addonSettings.viral_videos.video_urls
        .split("\n")
        .filter((url) => url.trim())
        .slice(0, addonSettings.viral_videos.max_videos || 5)
    }
    return [
      "https://www.tiktok.com/t/ZT29xucKT/",
      "https://www.tiktok.com/t/ZT29xucKT/",
      "https://www.tiktok.com/t/ZT29xucKT/",
    ]
  }

  // Parse marketplace links from settings
  const getMarketplaceLinks = () => {
    if (addonSettings.marketplace_links && addonSettings.marketplace_links.links) {
      try {
        return JSON.parse(addonSettings.marketplace_links.links)
      } catch (e) {
        console.error("Error parsing marketplace links:", e)
      }
    }
    return [
      { platform: "Amazon", url: "https://amazon.com/dp/B0123456789" },
      { platform: "eBay", url: "https://ebay.com/itm/123456789" },
      { platform: "Alibaba", url: "https://alibaba.com/product/123456789" },
      { platform: "AliExpress", url: "https://aliexpress.com/item/123456789" },
    ]
  }

  // Parse aliexpress suppliers from settings
  const getAliexpressSuppliers = () => {
    if (addonSettings.aliexpress_suppliers && addonSettings.aliexpress_suppliers.suppliers) {
      try {
        return JSON.parse(addonSettings.aliexpress_suppliers.suppliers)
      } catch (e) {
        console.error("Error parsing aliexpress suppliers:", e)
      }
    }
    return [
      { name: "Tech Gadgets Supplier", url: "https://aliexpress.com/supplier/123" },
      { name: "LED Accessories Co.", url: "https://aliexpress.com/supplier/456" },
      { name: "Smart Bags Factory", url: "https://aliexpress.com/supplier/789" },
      { name: "Outdoor Gear Direct", url: "https://aliexpress.com/supplier/101" },
    ]
  }

  // Get related search terms
  const getRelatedTerms = () => {
    if (addonSettings.search_volume && addonSettings.search_volume.related_terms) {
      try {
        return JSON.parse(addonSettings.search_volume.related_terms)
      } catch (e) {
        console.error("Error parsing related terms:", e)
      }
    }
    return product.searchVolume.relatedTerms || []
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    })
  }

  // Render addon section based on type
  const renderAddonSection = (type: string) => {
    // If no addons of this type exist, return null
    if (!addons[type] || addons[type].length === 0) {
      return null
    }

    const settings = addonSettings[type] || {}
    const addon = addons[type][0]

    // Render different addon types
    switch (type) {
      case "profit_cost":
        return (
          <div className="bg-white rounded-2xl border border-gray-300 shadow-md">
            <div className="bg-gray-100 w-full rounded-t-2xl py-3 border-b border-gray-300 flex justify-center">
              <h2 className="text-xl font-bold text-black text-center">{addon.title || "Your Profit & Cost"}</h2>
            </div>
            <div className="mt-6 flex justify-center gap-3 p-4 pb-8">
              {(settings.show_selling_price === undefined || settings.show_selling_price) && (
                <div className="bg-white border-2 border-gray-300 shadow-md rounded-xl p-3 text-center w-36 h-28 flex flex-col items-center justify-center">
                  <p className="text-3xl font-extrabold text-black">
                    ${settings.selling_price || product.sellingPrice}
                  </p>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Selling Price</p>
                </div>
              )}
              {(settings.show_product_cost === undefined || settings.show_product_cost) && (
                <div className="bg-white border-2 border-gray-300 shadow-md rounded-xl p-3 text-center w-36 h-28 flex flex-col items-center justify-center">
                  <p className="text-3xl font-extrabold text-black">${settings.product_cost || product.productCost}</p>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Product Cost</p>
                </div>
              )}
              {(settings.show_profit_margin === undefined || settings.show_profit_margin) && (
                <div className="bg-white border-2 border-gray-300 shadow-md rounded-xl p-3 text-center w-36 h-28 flex flex-col items-center justify-center">
                  <p className="text-3xl font-extrabold text-green-600">
                    $
                    {(
                      (settings.selling_price || product.sellingPrice) - (settings.product_cost || product.productCost)
                    ).toFixed(2)}
                  </p>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Profit Margin</p>
                </div>
              )}
            </div>
            {settings.custom_text && <div className="px-6 pb-4 text-center text-gray-600">{settings.custom_text}</div>}
          </div>
        )

      case "search_volume":
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search size={24} className="text-blue-500" />
              <h2 className="text-lg font-semibold">{addon.title || "Search Volume Analysis"}</h2>
            </div>
            {(settings.show_monthly_searches === undefined || settings.show_monthly_searches) && (
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {(settings.monthly_searches || product.searchVolume.monthly).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Monthly searches</p>
                </div>
                {(settings.show_trend === undefined || settings.show_trend) && (
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      (settings.trend || product.searchVolume.trend) === "increasing"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {(settings.trend || product.searchVolume.trend) === "increasing" ? "Trending Up" : "Trending Down"}
                  </span>
                )}
              </div>
            )}
            {(settings.show_related_terms === undefined || settings.show_related_terms) && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Related Search Terms</h3>
                {getRelatedTerms()
                  .slice(0, settings.max_related_terms || 5)
                  .map((term, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{term.term}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {term.volume.toLocaleString()} searches/mo
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )

      case "monthly_revenue":
        const profitPerSale = settings.profit_per_sale || product.profitMargin || 0
        const useCustomRevenue = settings.use_custom_revenue || false

        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={24} className="text-green-500" />
              <h2 className="text-lg font-semibold">{addon.title || "Estimated Monthly Revenue"}</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(settings.show_conservative === undefined || settings.show_conservative) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">CONSERVATIVE</p>
                  <p className="text-xl font-bold text-gray-900">
                    {useCustomRevenue
                      ? formatCurrency(settings.conservative_revenue || 0)
                      : calculateMonthlyRevenue(
                          settings.conservative_sales || product.estimatedSales.low,
                          profitPerSale,
                        )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {settings.conservative_sales || product.estimatedSales.low} sales/month
                  </p>
                </div>
              )}
              {(settings.show_realistic === undefined || settings.show_realistic) && (
                <div
                  className={`bg-gray-50 rounded-lg p-4 ${
                    settings.highlight_realistic === undefined || settings.highlight_realistic
                      ? "border-2 border-green-100"
                      : ""
                  }`}
                >
                  <p className="text-sm text-gray-500 mb-1">REALISTIC</p>
                  <p
                    className={`text-xl font-bold ${
                      settings.highlight_realistic === undefined || settings.highlight_realistic
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}
                  >
                    {useCustomRevenue
                      ? formatCurrency(settings.realistic_revenue || 0)
                      : calculateMonthlyRevenue(
                          settings.realistic_sales || product.estimatedSales.average,
                          profitPerSale,
                        )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {settings.realistic_sales || product.estimatedSales.average} sales/month
                  </p>
                </div>
              )}
              {(settings.show_optimistic === undefined || settings.show_optimistic) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">OPTIMISTIC</p>
                  <p className="text-xl font-bold text-gray-900">
                    {useCustomRevenue
                      ? formatCurrency(settings.optimistic_revenue || 0)
                      : calculateMonthlyRevenue(
                          settings.optimistic_sales || product.estimatedSales.high,
                          profitPerSale,
                        )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {settings.optimistic_sales || product.estimatedSales.high} sales/month
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case "viral_videos":
        const videoUrls = getVideoUrls()
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-black rounded-full p-1.5">
                <Play size={18} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold">{addon.title || "Viral Videos"}</h2>
            </div>
            <div className="relative">
              <div className="overflow-hidden">
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
                  {videoUrls.map((video, index) => (
                    <div key={index} className="relative flex-shrink-0 w-[280px] snap-start">
                      <div className="aspect-[9/10] bg-gray-100 rounded-lg overflow-hidden">
                        <iframe
                          src={getTikTokEmbedUrl(video)}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                      {(settings.show_views === undefined || settings.show_views) && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {Math.floor(Math.random() * 10) + 1}M views
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "marketplace_links":
        const marketplaceLinks = getMarketplaceLinks()
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <ExternalLink size={24} className="text-blue-500" />
              <h2 className="text-lg font-semibold">{addon.title || "Marketplace Links"}</h2>
            </div>
            <div className="space-y-3">
              {marketplaceLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <span className="text-gray-700">{link.platform}</span>
                  <ExternalLink size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )

      case "aliexpress_suppliers":
        const suppliers = getAliexpressSuppliers()
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag size={24} className="text-[#FF4646]" />
              <h2 className="text-lg font-semibold">{addon.title || "Aliexpress Suppliers"}</h2>
            </div>
            <div className="space-y-3">
              {suppliers.map((supplier, index) => (
                <a
                  key={index}
                  href={supplier.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <span className="text-gray-700">{supplier.name}</span>
                  <ExternalLink size={18} className="text-gray-400 group-hover:text-[#FF4646] transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )

      case "action_buttons":
        return (
          <div className="flex gap-4 mt-4">
            {(settings.show_aliexpress_button === undefined || settings.show_aliexpress_button) && (
              <a
                href={settings.aliexpress_button_url || "https://aliexpress.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FF4646] hover:bg-[#FF4646]/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {settings.aliexpress_button_text || "See on Aliexpress"}
              </a>
            )}
            {(settings.show_shopify_button === undefined || settings.show_shopify_button) && (
              <a
                href={settings.shopify_button_url || "https://shopify.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#96BF48] hover:bg-[#96BF48]/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <ShoppingCart size={18} />
                {settings.shopify_button_text || "Sell with Shopify"}
              </a>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
          <p className="mt-3 text-lg font-semibold text-gray-700">Loading Product...</p>
        </div>
      </div>
    )
  }

  // Render a locked product view if the product is locked
  if (isLocked && releaseTime) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="bg-yellow-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-6">
            This product will be available in {(() => {
              const timeRemaining = releaseTime.getTime() - currentTime.getTime()
              const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
              const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
              const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
              const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)

              return (
                <>
                  {days > 0 && `${days} days, `}
                  {hours > 0 && `${hours} hours, `}
                  {minutes > 0 && `${minutes} minutes, `}
                  {`${seconds} seconds`}
                </>
              )
            })()}
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Upgrade to Pro for Early Access
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLocked || product.is_top_product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="bg-purple-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          {product.is_top_product ? (
            <p className="text-gray-600 mb-6">This is a premium product available exclusively to Pro members.</p>
          ) : (
            <p className="text-gray-600 mb-6">This product is locked and requires a Pro membership to access.</p>
          )}
          <div className="space-y-4">
            <button
              onClick={() => navigate("/pricing")}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Upgrade to Pro to Unlock
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed || !imageRef.current) return

    const { left, top, width, height } = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100

    setZoomPosition({ x, y })
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-[40px] sm:mt-[40px] lg:mt-0">
      {/* Product details UI */}
      <div className="max-w-7xl mx-auto px-4 pt-[8px] pb-6 md:pt-4 md:pb-12 lg:pt-7 lg:pb-16">
        {/* If product is a top product, show a */}
        {product.is_top_product && (
          <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg mb-4 text-center">
            <span className="font-semibold">Top Product</span> - This is one of our top picks!
          </div>
        )}

        {/* Rest of the product details UI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-8 md:gap-16 lg:gap-16">
          <div className="space-y-4">
            <div
              className="bg-white rounded-xl p-4 border border-gray-200"
              ref={imageRef}
              onMouseMove={handleImageMouseMove}
              onClick={() => isZoomed && setIsZoomed(false)}
            >
              <div className="relative">
                <div
                  className="relative w-full aspect-square overflow-hidden rounded-lg cursor-zoom-in"
                  onClick={() => setIsZoomed(true)}
                >
                  {product.images && product.images[selectedImage] ? (
                    <img
                      src={product.images[selectedImage] || "/placeholder.svg"}
                      alt={product.name}
                      className={`w-full h-full ${isZoomed ? "absolute object-none" : "object-contain"}`}
                      style={
                        isZoomed
                          ? {
                              objectPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                              transform: "scale(2)",
                              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            }
                          : {}
                      }
                    />
                  ) : (
                    <img src="/placeholder.svg" alt="Placeholder" className="w-full h-full object-contain" />
                  )}
                </div>
                <button
                  className="absolute top-2 right-2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsZoomed(true)
                  }}
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? "border-primary" : "border-transparent hover:border-gray-200"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Render Viral Videos addon if enabled */}
            {renderAddonSection("viral_videos")}
          </div>

          <div className="space-y-6 sm:space-y-6 md:space-y-8 lg:space-y-8">
            <div>
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <button
                  onClick={toggleSave}
                  className={`p-2 rounded-lg transition ${
                    isSaved ? "bg-gray-800 text-gray-200" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  <Bookmark size={20} />
                </button>
              </div>

              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-500">Posted {product.postedDays} days ago</p>

                {/* Categories display */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((category, index) => (
                      <span key={index} className="px-3 py-1 text-sm bg-gray-100 rounded-full text-gray-700">
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Render Action Buttons addon if enabled */}
              {renderAddonSection("action_buttons")}
            </div>

            {/* Render Profit & Cost addon if enabled */}
            {renderAddonSection("profit_cost")}

            {/* Product Description Section */}
            {product?.description && (
              <div className="bg-white rounded-2xl border border-gray-300 shadow-md mt-6">
                <div className="bg-gray-100 w-full rounded-t-2xl py-3 border-b border-gray-300 flex justify-center">
                  <h2 className="text-xl font-bold text-black text-center">Product Description</h2>
                </div>
                <div className="p-6 text-gray-700">
                  <p className="whitespace-pre-line">
                    {isDescriptionExpanded
                      ? product.description
                      : product.description.slice(0, DESCRIPTION_LIMIT) +
                        (product.description.length > DESCRIPTION_LIMIT ? "..." : "")}
                  </p>
                  {product.description.length > DESCRIPTION_LIMIT && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-4 text-blue-600 flex items-center hover:text-blue-700"
                    >
                      {isDescriptionExpanded ? "➖ Show less" : "➕ Read more"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Render Search Volume addon if enabled */}
            {renderAddonSection("search_volume")}

            {/* Render Monthly Revenue addon if enabled */}
            {renderAddonSection("monthly_revenue")}

            {/* Render Marketplace Links addon if enabled */}
            {renderAddonSection("marketplace_links")}

            {/* Render Aliexpress Suppliers addon if enabled */}
            {renderAddonSection("aliexpress_suppliers")}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails

