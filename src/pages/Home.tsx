"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { Clock, DollarSign, BarChart2, Factory, Video, FileText, Image, Bookmark } from "lucide-react"

// Update the PRODUCTS_PER_PAGE constant to 5 (to load 5 products at a time)
const PRODUCTS_PER_PAGE = 5
const MAX_PRODUCTS = 22 // Maximum number of products to load

const Home = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<any>([])
  const [savedProducts, setSavedProducts] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [nextReleaseTime, setNextReleaseTime] = useState<Date | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)
  const [userSubscription, setUserSubscription] = useState("free") // Default to free

  // Add a new state variable to track the total number of products loaded
  const [totalProductsLoaded, setTotalProductsLoaded] = useState(0)
  const [showCtaOverlay, setShowCtaOverlay] = useState(false)
  const [productReleaseTimes, setProductReleaseTimes] = useState<{
    [key: number]: { hours: number; minutes: number; seconds: number }
  }>({})

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      // If user is authenticated, hide the CTA overlay
      if (user) {
        setShowCtaOverlay(false)

        // Check subscription tier
        try {
          const { data: customer } = await supabase
            .from("customers")
            .select("subscription_tier")
            .eq("user_id", user.id)
            .single()

          if (customer) {
            setUserSubscription(customer.subscription_tier)
          }
        } catch (error) {
          console.error("Error fetching subscription status:", error)
        }
      }
    }

    checkAuth()
  }, [])

  // Update current time every second for accurate "released X time ago" labels
  // and update product release times
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())

      // Update all product release times
      const updatedTimes: { [key: number]: { hours: number; minutes: number; seconds: number } } = {}

      products.forEach((product: any) => {
        if (product.release_time && new Date(product.release_time) > new Date()) {
          const timeRemaining = calculateTimeRemaining(new Date(product.release_time))
          updatedTimes[product.id] = timeRemaining
        }
      })

      setProductReleaseTimes(updatedTimes)
    }, 1000)

    return () => clearInterval(timer)
  }, [products])

  // Update current time every second for accurate countdown
  // and countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())

      if (nextReleaseTime) {
        const difference = nextReleaseTime.getTime() - new Date().getTime()

        if (difference <= 0) {
          // Time's up, fetch the next release
          fetchNextRelease()
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [nextReleaseTime])

  // Calculate time remaining between now and a target date
  const calculateTimeRemaining = (targetDate: Date) => {
    const now = new Date()
    const difference = targetDate.getTime() - now.getTime()

    const seconds = Math.floor((difference / 1000) % 60)
    const minutes = Math.floor((difference / (1000 * 60)) % 60)
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
    const days = Math.floor(difference / (1000 * 60 * 60 * 24))

    return { days, hours, minutes, seconds }
  }

  // Update the fetchNextRelease function to get the next scheduled release instead of the most recent release
  const fetchNextRelease = async () => {
    try {
      // Fetch the next scheduled release (product with future release_time)
      const { data, error } = await supabase
        .from("products")
        .select("release_time")
        .gt("release_time", new Date().toISOString()) // Get products with release_time in the future
        .order("release_time", { ascending: true }) // Order by closest upcoming release
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        // Set the next release time
        setNextReleaseTime(new Date(data[0].release_time))
      } else {
        // If no scheduled releases, set a default 24h from now
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setNextReleaseTime(tomorrow)
      }
    } catch (error) {
      console.error("Error fetching next release:", error)
    }
  }

  // Update the fetchProducts function to track total products loaded
  const fetchProducts = async () => {
    setLoading(true)
    try {
      // Fetch products with pagination - order by created_at to get recently added
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, PRODUCTS_PER_PAGE - 1)

      if (error) throw error

      // Fetch saved products for the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: savedData, error: savedError } = await supabase
          .from("saved_products")
          .select("product_id")
          .eq("user_id", user.id)

        if (!savedError && savedData) {
          setSavedProducts(new Set(savedData.map((item) => item.product_id)))
        }
      }

      // Initialize release times for upcoming products
      const initialTimes: { [key: number]: { hours: number; minutes: number; seconds: number } } = {}

      if (data) {
        data.forEach((product: any) => {
          if (product.release_time && new Date(product.release_time) > new Date()) {
            const timeRemaining = calculateTimeRemaining(new Date(product.release_time))
            initialTimes[product.id] = timeRemaining
          }
        })

        setProductReleaseTimes(initialTimes)
      }

      setProducts(data || [])
      setTotalProductsLoaded(data?.length || 0)
      setHasMore(data && data.length === PRODUCTS_PER_PAGE)
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch initial products
  useEffect(() => {
    fetchProducts()
    fetchNextRelease()
  }, [])

  // Update the loadMoreProducts function to check if we've reached the maximum
  const loadMoreProducts = async () => {
    if (loadingMore) return

    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const start = nextPage * PRODUCTS_PER_PAGE - PRODUCTS_PER_PAGE
      const end = nextPage * PRODUCTS_PER_PAGE - 1

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .range(start, end)

      if (error) throw error

      if (data && data.length > 0) {
        // Update release times for new products
        const newTimes = { ...productReleaseTimes }

        data.forEach((product: any) => {
          if (product.release_time && new Date(product.release_time) > new Date()) {
            const timeRemaining = calculateTimeRemaining(new Date(product.release_time))
            newTimes[product.id] = timeRemaining
          }
        })

        setProductReleaseTimes(newTimes)

        const newTotalLoaded = totalProductsLoaded + data.length
        setTotalProductsLoaded(newTotalLoaded)

        setProducts((prev) => [...prev, ...data])
        setPage(nextPage)

        // Check if we've reached 20 products to show CTA (only for unauthenticated users)
        if (newTotalLoaded >= 20 && !isAuthenticated) {
          setShowCtaOverlay(true)
        }

        // Always allow loading more products up to MAX_PRODUCTS
        setHasMore(data.length === PRODUCTS_PER_PAGE && newTotalLoaded < MAX_PRODUCTS)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more products:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Set up intersection observer for infinite scrolling
  const lastProductRef = useCallback(
    (node) => {
      if (loading || loadingMore) return

      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreProducts()
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, loadingMore, hasMore],
  )

  const toggleSaveProduct = async (productId: number, e: React.MouseEvent) => {
    e.stopPropagation()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate("/login")
      return
    }

    if (savedProducts.has(productId)) {
      // Remove from saved products
      const { error } = await supabase
        .from("saved_products")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)

      if (!error) {
        setSavedProducts((prev) => {
          const newSet = new Set(prev)
          newSet.delete(productId)
          return newSet
        })
      }
    } else {
      // Add to saved products
      const { error } = await supabase.from("saved_products").insert({ user_id: user.id, product_id: productId })

      if (!error) {
        setSavedProducts((prev) => new Set(prev).add(productId))
      }
    }
  }

  const handleShowMeMoney = (productId: number) => {
    // Direct navigation with no conditions
    window.location.href = `/product/${productId}`
  }

  // Format time ago
  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((currentTime.getTime() - new Date(date).getTime()) / 1000)

    if (seconds < 60) return `${seconds} seconds ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? "s" : ""} ago`
  }

  // Calculate time remaining for countdown
  const getTimeRemaining = () => {
    if (!nextReleaseTime) return { hours: 0, minutes: 0, seconds: 0 }

    const total = nextReleaseTime.getTime() - currentTime.getTime()
    const seconds = Math.floor((total / 1000) % 60)
    const minutes = Math.floor((total / 1000 / 60) % 60)
    const hours = Math.floor(total / (1000 * 60 * 60))

    return { hours, minutes, seconds }
  }

  const timeRemaining = getTimeRemaining()

  // Add a useEffect to check if we should show the CTA overlay when products change
  useEffect(() => {
    // Only show CTA if user is not authenticated and we've loaded enough products
    if (totalProductsLoaded >= 20 && !isAuthenticated) {
      setShowCtaOverlay(true)
    } else {
      setShowCtaOverlay(false)
    }
  }, [totalProductsLoaded, isAuthenticated])

  return (
    <div className="min-h-screen bg-[#FFF8EC]">
      {/* Main container that will define the content width */}
      <div className="mx-auto" style={{ maxWidth: "1280px" }}>
        {/* Navigation - Optimized for mobile */}
        <nav className="fixed top-0 left-0 right-0 bg-[#FFF8EC] z-50 py-4">
          <div className="mx-auto px-4" style={{ maxWidth: "1280px" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img src="https://i.postimg.cc/QxLkYX3X/Ecom-Degen-Logo.png" alt="WinProd AI" className="h-12 w-auto" />
                <span className="ml-2 text-2xl font-bold text-[#111827] font-sans">
                  <span>WIN</span>
                  <span className="text-[#FF8A00]">PROD</span>
                  <span> AI</span>
                </span>
              </div>

              <div className="flex items-center gap-4">
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="text-[#111827] hover:text-[#FF8A00] transition-colors font-medium"
                  >
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate("/login")}
                      className="text-[#111827] hover:text-[#FF8A00] transition-colors"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => navigate("/register")}
                      className="bg-[#FF8A00] hover:bg-[#FF8A00]/90 text-white px-6 py-2 rounded-full transition-colors"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-24 pb-12 px-4">
          {/* Main Heading */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-2"
              style={{ fontFamily: "'Zilla Slab', serif" }}
            >
              Winning Products For Ecommerce,
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-[#FF8A00]" style={{ fontFamily: "'Zilla Slab', serif" }}>
              Curated By AI
            </h2>
          </div>

          {/* Countdown Timer */}
          {nextReleaseTime && (
            <div className="max-w-md mx-auto mb-10 text-center">
              <div className="bg-white rounded-full shadow-sm px-4 py-2 inline-flex items-center whitespace-nowrap">
                <Clock size={16} className="text-gray-600 mr-2" />
                <span className="text-sm font-medium text-gray-700 mr-2">Next Winning Product Released In:</span>
                <div className="bg-[#FFEDD5] rounded-full w-7 h-7 flex items-center justify-center mr-1">
                  <span className="text-sm font-bold text-gray-800">
                    {timeRemaining.hours.toString().padStart(2, "0")}
                  </span>
                </div>
                <span className="text-xs text-gray-600 mr-2">Hours</span>
                <div className="bg-[#FFEDD5] rounded-full w-7 h-7 flex items-center justify-center mr-1">
                  <span className="text-sm font-bold text-gray-800">
                    {timeRemaining.minutes.toString().padStart(2, "0")}
                  </span>
                </div>
                <span className="text-xs text-gray-600 mr-2">Minutes</span>
                <div className="bg-[#FFEDD5] rounded-full w-7 h-7 flex items-center justify-center mr-1">
                  <span className="text-sm font-bold text-gray-800">
                    {timeRemaining.seconds.toString().padStart(2, "0")}
                  </span>
                </div>
                <span className="text-xs text-gray-600">Seconds</span>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.length > 0 ? (
              products.map((product: any, index: number) => {
                const isLastItem = index === products.length - 1
                const isComingSoon = product.release_time && new Date(product.release_time) > new Date()
                const productTime = productReleaseTimes[product.id]

                // Check if this product should be partially hidden by the CTA
                const isPartiallyHidden = index >= 20 && index < 22 && showCtaOverlay

                return (
                  <div
                    key={product.id}
                    ref={isLastItem ? lastProductRef : null}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 relative ${isPartiallyHidden ? "z-0" : ""}`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="w-1/3 aspect-square relative rounded-xl overflow-hidden">
                          <img
                            src={product.images ? product.images[0] : "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          {isComingSoon && (
                            <div className="absolute top-0 left-0">
                              <div className="bg-[#FF8A00] text-white px-4 py-1 text-sm font-medium flex items-center relative">
                                COMMING SOON
                                <div className="w-0 h-0 border-t-[12px] border-b-[12px] border-l-[12px] border-t-transparent border-b-transparent border-l-[#FF8A00] absolute -right-[12px]"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="w-2/3">
                          <h3 className="font-medium text-[#111827] mb-1">{product.name}</h3>

                          {isComingSoon && productTime ? (
                            <p className="text-xs text-gray-500 mb-3">
                              Product Released in:{" "}
                              <span className="text-[#FF8A00]">
                                {productTime.hours}hr : {productTime.minutes}min : {productTime.seconds}sec
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mb-3">
                              Posted{" "}
                              {Math.floor(
                                (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24),
                              )}{" "}
                              day ago
                            </p>
                          )}

                          <div className="mb-3">
                            <p className="text-xs text-gray-700 mb-2">Available info:</p>
                            <div className="bg-[#FFF8EC] rounded-lg p-2">
                              <div className="grid grid-cols-3 gap-2">
                                <div className="flex items-center gap-1">
                                  <DollarSign size={14} className="text-gray-600" />
                                  <span className="text-xs text-gray-600">PROFIT</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <BarChart2 size={14} className="text-gray-600" />
                                  <span className="text-xs text-gray-600">ANALYTICS</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Factory size={14} className="text-gray-600" />
                                  <span className="text-xs text-gray-600">SUPPLIERS</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Video size={14} className="text-gray-600" />
                                  <span className="text-xs text-gray-600">VIDEOS</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileText size={14} className="text-gray-600" />
                                  <span className="text-xs text-gray-600">DESCRIPTION</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Image size={14} className="text-gray-600" />
                                  <span className="text-xs text-gray-600">IMAGES</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => handleShowMeMoney(product.id)}
                              className="flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-[#0F172A] hover:bg-[#1E293B] text-white"
                            >
                              Show Me The Money!
                            </button>

                            <button
                              onClick={(e) => toggleSaveProduct(product.id, e)}
                              className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200"
                            >
                              <Bookmark
                                size={18}
                                className={
                                  savedProducts.has(product.id) ? "fill-[#FF8A00] text-[#FF8A00]" : "text-gray-400"
                                }
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-2 py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#FF8A00] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading Products...</p>
              </div>
            )}
          </div>

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-[#FF8A00] mr-3"></div>
              <p className="text-gray-600">Loading more products...</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section with blurred background - positioned to overlay products 21 and 22 */}
      {showCtaOverlay && (
        <div className="relative overflow-hidden my-8 -mt-[300px] md:-mt-[300px]">
          {/* White blurry background */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 text-center">
            <h2
              className="text-2xl md:text-3xl font-bold text-[#1E293B] mb-2"
              style={{ fontFamily: "'Zilla Slab', serif" }}
            >
              Our AI is adding winning products on
            </h2>
            <div className="flex flex-col items-center">
              <h3
                className="text-2xl md:text-3xl font-bold text-[#FF8A00] mb-2"
                style={{ fontFamily: "'Zilla Slab', serif" }}
              >
                a daily basis.
              </h3>
              <div className="w-36 h-1 bg-[#FF8A00] rounded-full mb-6"></div>
            </div>
            <div className="max-w-2xl mx-auto">
              <p className="text-lg font-bold text-[#1E293B] mb-3">Stop wasting money on bad products</p>
              <p className="text-gray-600 mb-6">
                Want to be a successful store owner? Get instant access to our AI-curated winning products list with
                detailed analytics and targeting data.
              </p>
              <button
                onClick={() => navigate("/register")}
                className="bg-[#FF8A00] hover:bg-[#FF8A00]/90 text-white px-8 py-3 rounded-full font-medium transition-colors text-lg"
              >
                Join Now! It's Free :)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - completely outside the container for full width */}
      <footer className="bg-[#FF8A00] py-4 text-white w-full">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">© 2025 WinProd AI. All rights reserved.</p>
            <div className="flex space-x-8 mt-2 md:mt-0">
              <a href="/privacy" className="text-sm hover:underline">
                PRIVACY
              </a>
              <a href="/terms" className="text-sm hover:underline">
                TERMS
              </a>
              <a href="/getting-started" className="text-sm hover:underline">
                GETTING STARTED
              </a>
              <a href="/faq" className="text-sm hover:underline">
                FAQ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home

