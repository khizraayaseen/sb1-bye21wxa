"use client"

import { useState, useEffect } from "react"
import { Bookmark, Search, Filter, ArrowRight, X } from "lucide-react"
import { supabase } from "../lib/supabase"

const SavedProducts = () => {
  const [savedProducts, setSavedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchSavedProducts()
  }, [])

  const fetchSavedProducts = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await supabase
        .from("saved_products")
        .select(`
          *,
          products:product_id (*)
        `)
        .eq("user_id", user.id)

      if (error) {
        console.error("Error fetching saved products:", error)
      } else {
        setSavedProducts(data.map((item) => item.products))
      }
    }
    setLoading(false)
  }

  const removeSavedProduct = async (productId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase
        .from("saved_products")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)

      if (error) {
        console.error("Error removing saved product:", error)
      } else {
        setSavedProducts(savedProducts.filter((product) => product.id !== productId))
      }
    }
  }

  const filteredProducts = savedProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark size={24} className="text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Saved Products</h1>
          </div>
          <p className="text-gray-600">Manage and organize your saved products</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search saved products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading saved products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="relative h-48">
                  <img
                    src={product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                      onClick={() => removeSavedProduct(product.id)}
                    >
                      <X size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Saved {new Date(product.created_at).toLocaleDateString()}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="ml-1 font-medium text-gray-900">${product.selling_price}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Profit:</span>
                      <span className="ml-1 font-medium text-green-600">${product.profit_margin}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => (window.location.href = `/product/${product.id}`)}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    View Details
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bookmark size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved products yet</h3>
            <p className="text-gray-600 mb-4">Start saving products to build your collection</p>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="inline-flex items-center justify-center px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
            >
              Discover Products
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedProducts
