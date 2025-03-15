"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Lock,
  Bookmark,
  DollarSign,
  BarChart2,
  MessageSquare,
  Link,
  Facebook,
  Play,
  Target,
  Tag,
  Clock,
} from "lucide-react"
import Footer from "../components/Footer"
import { supabase } from "../lib/supabase"

const PRODUCTS_PER_PAGE = 10

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

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      if (user) {
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
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

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

  // Fetch initial products
  useEffect(() => {
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

        setProducts(data || [])
        setHasMore(data && data.length === PRODUCTS_PER_PAGE)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
    fetchNextRelease()
  }, [])

  // Load more products when scrolling
  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore) return

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
        setProducts((prev) => [...prev, ...data])
        setPage(nextPage)
        setHasMore(data.length === PRODUCTS_PER_PAGE)
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

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation - Optimized for mobile */}
      <nav className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 sm:h-20 md:h-24">
            <div className="flex items-center">
              <img
                src="https://i.postimg.cc/3JQd5V6C/WINPROD-AI-Twitch-Banner-1.png"
                alt="WinProd AI"
                className="h-10 sm:h-12 md:h-24 w-auto"
              />
            </div>

            {isAuthenticated ? (
              // User is logged in - show profile dropdown matching dashboard
              <div className="relative group">
                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
                  <span>{userSubscription === "pro" ? "Pro User" : "My Account"}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform group-hover:rotate-180"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="py-2">
                    <a href="/dashboard" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                      Dashboard
                    </a>
                    {userSubscription !== "pro" && (
                      <a href="/pricing" className="block px-4 py-2 text-purple-600 font-medium hover:bg-gray-100">
                        Upgrade to Pro
                      </a>
                    )}
                    <a href="/account" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                      Account
                    </a>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut()
                        navigate("/")
                        window.location.reload()
                      }}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // User is not logged in - show login/register buttons
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                <button
                  onClick={() => navigate("/login")}
                  className="text-white hover:text-primary transition-colors text-sm sm:text-base px-2.5 py-1.5 sm:px-4 sm:py-2"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="bg-primary hover:bg-primary/90 text-white text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Short Header with Countdown Timer */}
      <div className="pt-20 sm:pt-24 md:pt-32 pb-4 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            Winning Products For Ecommerce, Curated By AI
          </h1>

          {/* Countdown Timer - Now showing most recent release */}
          {nextReleaseTime && (
            <div className="max-w-md mx-auto mb-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-center gap-3">
                <Clock size={24} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Next product dropping in:</p>
                  <p className="text-xl font-bold text-white">
                    {(() => {
                      const timeRemaining = nextReleaseTime.getTime() - currentTime.getTime()
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
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid - Instagram Style */}
      <div className="relative max-w-6xl mx-auto px-2 py-0 sm:px-4 pb-8 sm:py-4 md:pb-20">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-transparent" />

        <div className="relative">
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 p-2 sm:p-4 md:p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            {products && products?.length > 0 ? (
              products.map((product: any, index: number) => {
                const isLastItem = index === products.length - 1
                return (
                  <div
                    key={product.id}
                    ref={isLastItem ? lastProductRef : null}
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex h-[180px]">
                      {/* Product Image */}
                      <div className="relative w-[180px] shrink-0">
                        <img
                          src={product.images ? product.images[0] : "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.is_locked && !isAuthenticated && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                            <Lock size={24} className="text-white" />
                          </div>
                        )}

                        {/* Add released time ago label */}
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          Released {formatTimeAgo(product.created_at)}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 p-4 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">{product.name}</h3>
                            <p className="text-xs text-gray-500">
                              Posted {product.posted || formatTimeAgo(product.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            {
                              icon: DollarSign,
                              label: "PROFITS",
                              color: "text-green-600",
                            },
                            {
                              icon: BarChart2,
                              label: "ANALYTICS",
                              color: "text-orange-500",
                            },
                            {
                              icon: MessageSquare,
                              label: "ENGAGEMENT",
                              color: "text-blue-500",
                            },
                            {
                              icon: Link,
                              label: "LINKS",
                              color: "text-purple-500",
                            },
                            {
                              icon: Facebook,
                              label: "FB ADS",
                              color: "text-blue-600",
                            },
                            { icon: Play, label: "VIDEO", color: "text-red-500" },
                            {
                              icon: Target,
                              label: "TARGETING",
                              color: "text-indigo-500",
                            },
                            {
                              icon: Tag,
                              label: "RETAIL PRICE",
                              color: "text-yellow-600",
                            },
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
                        onClick={() => handleShowMeMoney(product.id)}
                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-secondary hover:bg-secondary/90 text-white shadow-sm hover:shadow"
                      >
                        Show Me The Money!
                      </button>

                      <button
                        onClick={(e) => toggleSaveProduct(product.id, e)}
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
                )
              })
            ) : (
              <div className="flex flex-col col-span-2 items-center justify-center bg-black text-white text-center px-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
                <p className="mt-4 text-lg font-semibold text-gray-400">Loading Products...</p>
              </div>
            )}
          </div>

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center items-center py-6 text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-primary mr-3"></div>
              <p>Loading more products...</p>
            </div>
          )}

          {/* End of products message */}
          {!hasMore && products.length > 0 && !loading && (
            <div className="max-w-2xl mx-auto text-center mt-8 px-3 sm:px-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Ready to see more winning products?</h2>
              <p className="text-sm md:text-base text-gray-300 mb-6">
                Sign up now to unlock all our AI-curated winning products with detailed analytics and targeting data.
              </p>
              <button
                onClick={() => navigate("/register")}
                className="bg-[#47D147] hover:bg-[#47D147]/90 text-white text-base sm:text-lg font-medium px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg transition-colors"
              >
                Join now! It's Free :)
              </button>
            </div>
          )}

          {/* Join Overlay - Only show if there are 20+ products */}
          {products.length >= 20 && (
            <div className="absolute bottom-0 top-56 left-0 right-0 h-[280px] sm:h-[300px] md:h-[320px] bg-gradient-to-t from-black via-black/95 to-black/90 backdrop-blur-sm rounded-xl">
              <div className="max-w-2xl mx-auto text-center pt-8 sm:pt-10 md:pt-12 px-3 sm:px-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">
                  Our AI is adding winning products on a daily basis.
                </h2>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-primary mb-4">
                  Stop wasting money on bad products
                </h3>
                <p className="text-sm md:text-base text-gray-300 mb-6">
                  Want to be a successful store owner? Get instant access to our AI-curated winning products list with
                  detailed analytics and targeting data.
                </p>
                <button
                  onClick={() => navigate("/register")}
                  className="bg-[#47D147] hover:bg-[#47D147]/90 text-white text-base sm:text-lg md:text-xl font-medium px-6 sm:px-8 md:px-12 py-2.5 sm:py-3 md:py-4 rounded-lg transition-colors"
                >
                  Join now! It's Free :)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Home

