"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  ChevronDown,
  Lock,
  Unlock,
  Save,
  X,
  ImageIcon,
  Loader2,
  Star,
  Calendar,
} from "lucide-react"
import { supabase } from "../../lib/supabase"

// Define products per page constant for admin
const PRODUCTS_PER_PAGE = 10

// Update the Product interface to include release_time
interface Product {
  id: string
  name: string
  description: string
  selling_price: number
  product_cost: number
  profit_margin: number
  is_locked: boolean
  images: string[]
  created_at: string
  stats: any // Customize as needed
  specifications: any // Customize as needed
  is_top_product?: boolean
  priority?: number
  release_time?: string | null // Add this field
  // No category_ids field as it's in a junction table
}

// Update the ProductFormData interface to include release_time
interface ProductFormData {
  name: string
  description: string
  selling_price: string | number
  product_cost: string | number
  is_locked: boolean
  category_ids: string[] // We'll keep this in the form data for UI purposes
  images: string[]
  stats: {
    engagement: string
    fbAds: string
    targetingInfo: string
    searchVolume: {
      monthly: number
      trend: string
      relatedTerms: string[]
    }
    aliexpressOrders: {
      daily: number
      weekly: number
      monthly: number
      trend: string
    }
  }
  specifications: {
    material: string
    dimensions: {
      small: string
      large: string
    }
  }
  is_top_product: boolean
  priority: number
  release_time: string | null // Add this field
}

interface Category {
  id: string
  name: string
}

interface ProductWithCategories extends Product {
  categories: Category[]
}

// Function to check if the storage bucket exists and is accessible
const checkStorageBucket = async () => {
  try {
    // Try to list files in the bucket to check if it exists and is accessible
    const { data, error } = await supabase.storage.from("productImages").list()

    if (error) {
      console.error("Error accessing productImages bucket:", error)
      return false
    }

    console.log("productImages bucket is accessible")
    return true
  } catch (error) {
    console.error("Error checking storage bucket:", error)
    return false
  }
}

// Update the fetchProductsAPI function to include pagination
const fetchProductsAPI = async (page = 1): Promise<{ products: ProductWithCategories[]; totalCount: number }> => {
  try {
    // Calculate pagination offsets
    const from = (page - 1) * PRODUCTS_PER_PAGE
    const to = from + PRODUCTS_PER_PAGE - 1

    // Fetch products with pagination and count
    const {
      data: products,
      error: productsError,
      count,
    } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to)

    if (productsError) throw productsError

    // For each product, fetch its categories
    const productsWithCategories = await Promise.all(
      (products || []).map(async (product) => {
        // Get category IDs for this product from the junction table
        const { data: productCategories, error: junctionError } = await supabase
          .from("product_categories")
          .select("category_id")
          .eq("product_id", product.id)

        if (junctionError) throw junctionError

        // Get the actual category objects
        const categoryIds = productCategories?.map((pc) => pc.category_id) || []
        let categories: Category[] = []

        if (categoryIds.length > 0) {
          const { data: categoryData, error: categoriesError } = await supabase
            .from("categories")
            .select("*")
            .in("id", categoryIds)

          if (categoriesError) throw categoriesError
          categories = categoryData || []
        }

        return {
          ...product,
          categories,
        }
      }),
    )

    return {
      products: productsWithCategories,
      totalCount: count || 0,
    }
  } catch (error) {
    console.error("Error fetching products:", error)
    return { products: [], totalCount: 0 }
  }
}

// Add a function to fetch top products
const fetchTopProductsAPI = async (): Promise<ProductWithCategories[]> => {
  try {
    // Fetch top products ordered by priority
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_top_product", true)
      .order("priority", { ascending: false })

    if (productsError) throw productsError

    // For each product, fetch its categories
    const productsWithCategories = await Promise.all(
      (products || []).map(async (product) => {
        // Get category IDs for this product from the junction table
        const { data: productCategories, error: junctionError } = await supabase
          .from("product_categories")
          .select("category_id")
          .eq("product_id", product.id)

        if (junctionError) throw junctionError

        // Get the actual category objects
        const categoryIds = productCategories?.map((pc) => pc.category_id) || []
        let categories: Category[] = []

        if (categoryIds.length > 0) {
          const { data: categoryData, error: categoriesError } = await supabase
            .from("categories")
            .select("*")
            .in("id", categoryIds)

          if (categoriesError) throw categoriesError
          categories = categoryData || []
        }

        return {
          ...product,
          categories,
        }
      }),
    )

    return productsWithCategories
  } catch (error) {
    console.error("Error fetching top products:", error)
    return []
  }
}

const fetchCategoriesAPI = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })
    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

/**
 * Create a new product and its category relationships.
 * @param productData - The data for the new product.
 * @returns The newly created product with its categories.
 */
const createProductAPI = async (
  productData: Partial<Product>,
  categoryIds: string[],
): Promise<ProductWithCategories | null> => {
  try {
    console.log("Creating product with data:", productData)

    // Ensure required fields are present
    if (!productData.name || !productData.selling_price || !productData.product_cost) {
      console.error("Missing required fields for product creation")
      throw new Error("Missing required fields: name, selling_price, and product_cost are required")
    }

    // Remove profit_margin if it exists since it's a generated column
    if ("profit_margin" in productData) {
      delete productData.profit_margin
    }

    // Create a clean copy of the product data to avoid any reference issues
    const cleanProductData = { ...productData }

    // First, create the product
    const { data: product, error: productError } = await supabase.from("products").insert([cleanProductData]).select()

    if (productError) {
      console.error("Error creating product:", productError)
      throw productError
    }

    if (!product || product.length === 0) {
      console.error("No product returned after insert")
      return null
    }

    const newProduct = product[0]
    console.log("Product created successfully:", newProduct)

    // Then, create the category relationships
    if (categoryIds && categoryIds.length > 0) {
      const categoryRelations = categoryIds.map((categoryId) => ({
        product_id: newProduct.id,
        category_id: categoryId,
      }))

      console.log("Creating category relationships:", categoryRelations)
      const { error: relationError } = await supabase.from("product_categories").insert(categoryRelations)

      if (relationError) {
        console.error("Error creating category relationships:", relationError)
        // Don't throw here, we still want to return the product even if category relationships fail
      } else {
        console.log("Category relationships created successfully")
      }
    }

    // Return the product with its categories
    const categories = await getCategoriesForProduct(newProduct.id)
    console.log("Retrieved categories for product:", categories)

    return {
      ...newProduct,
      categories,
    }
  } catch (error) {
    console.error("Error creating product:", error)
    throw error // Re-throw to allow proper handling in the calling function
  }
}

/**
 * Update an existing product and its category relationships.
 * @param id - The ID of the product to update.
 * @param productData - The updated product data.
 * @param categoryIds - The updated category IDs.
 * @returns The updated product with its categories.
 */
const updateProductAPI = async (
  id: string,
  productData: Partial<Product>,
  categoryIds: string[],
): Promise<ProductWithCategories | null> => {
  try {
    // Remove profit_margin if it exists since it's a generated column
    if ("profit_margin" in productData) {
      delete productData.profit_margin
    }

    // First, update the product
    const { data: product, error: productError } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id)
      .select()

    if (productError) throw productError
    if (!product || product.length === 0) return null

    const updatedProduct = product[0]

    // Then, delete existing category relationships
    const { error: deleteError } = await supabase.from("product_categories").delete().eq("product_id", id)

    if (deleteError) throw deleteError

    // Finally, create new category relationships
    if (categoryIds.length > 0) {
      const categoryRelations = categoryIds.map((categoryId) => ({
        product_id: id,
        category_id: categoryId,
      }))

      const { error: relationError } = await supabase.from("product_categories").insert(categoryRelations)

      if (relationError) throw relationError
    }

    // Return the product with its categories
    return {
      ...updatedProduct,
      categories: await getCategoriesForProduct(id),
    }
  } catch (error) {
    console.error("Error updating product:", error)
    return null
  }
}

/**
 * Get categories for a specific product.
 * @param productId - The ID of the product.
 * @returns Array of categories.
 */
const getCategoriesForProduct = async (productId: string): Promise<Category[]> => {
  try {
    // Get category IDs for this product from the junction table
    const { data: productCategories, error: junctionError } = await supabase
      .from("product_categories")
      .select("category_id")
      .eq("product_id", productId)

    if (junctionError) throw junctionError

    // Get the actual category objects
    const categoryIds = productCategories?.map((pc) => pc.category_id) || []

    if (categoryIds.length === 0) return []

    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .in("id", categoryIds)

    if (categoriesError) throw categoriesError
    return categories || []
  } catch (error) {
    console.error("Error fetching categories for product:", error)
    return []
  }
}

/**
 * Delete a product.
 * @param id - The ID of the product to delete.
 * @returns Boolean indicating success.
 */
const deleteProductAPI = async (id: string): Promise<boolean> => {
  try {
    // The junction table entries will be automatically deleted due to ON DELETE CASCADE
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    return false
  }
}

/**
 * Bulk delete products.
 * @param ids - Array of product IDs to delete.
 * @returns Boolean indicating success.
 */
const deleteMultipleProductsAPI = async (ids: string[]): Promise<boolean> => {
  try {
    // The junction table entries will be automatically deleted due to ON DELETE CASCADE
    const { error } = await supabase.from("products").delete().in("id", ids)
    if (error) throw error
    return true
  } catch (error) {
    console.error("Error deleting multiple products:", error)
    return false
  }
}

/**
 * Toggle the lock status of a product.
 * @param product - The product whose lock status should be toggled.
 * @returns The updated product.
 */
const toggleLockAPI = async (product: Product): Promise<ProductWithCategories | null> => {
  try {
    const updatedLockStatus = !product.is_locked
    const { data, error } = await supabase
      .from("products")
      .update({ is_locked: updatedLockStatus })
      .eq("id", product.id)
      .select()

    if (error) throw error
    if (!data || data.length === 0) return null

    return {
      ...data[0],
      categories: await getCategoriesForProduct(product.id),
    }
  } catch (error) {
    console.error("Error toggling lock status:", error)
    return null
  }
}

/**
 * Create a default "Profit & Cost" addon for a product.
 * @param product - The product to create the addon for.
 */
const createDefaultProfitCostAddon = async (product: ProductWithCategories) => {
  try {
    // Create default content for the profit_cost addon
    const defaultContent = {
      show_selling_price: true,
      show_product_cost: true,
      show_profit_margin: true,
      selling_price: product.selling_price,
      product_cost: product.product_cost,
      profit_margin: (product.selling_price - product.product_cost).toFixed(2),
      custom_text: "",
    }

    // Check if this product already has a profit_cost addon
    const { data: existingAddons, error: checkError } = await supabase
      .from("product_addons")
      .select("*")
      .eq("product_id", product.id)
      .eq("type", "profit_cost")

    if (checkError) throw checkError

    // Only create if no existing addon of this type for this product
    if (!existingAddons || existingAddons.length === 0) {
      const addonData = {
        type: "profit_cost",
        title: "Your Profit & Cost",
        content: JSON.stringify(defaultContent, null, 2),
        enabled: true,
        order: 1,
        product_id: product.id,
        created_at: new Date(),
        updated_at: new Date(),
      }

      const { error } = await supabase.from("product_addons").insert([addonData])
      if (error) throw error
      console.log("Created default profit_cost addon for product:", product.id)
    }
  } catch (error) {
    console.error("Error creating default profit_cost addon:", error)
    // Don't block product creation if addon creation fails
  }
}

/**
 * Update the "Profit & Cost" addon for a product when the product is updated.
 * @param product - The updated product.
 */
const updateProductProfitCostAddon = async (product: ProductWithCategories) => {
  try {
    // Find existing profit_cost addon for this product
    const { data: existingAddons, error: checkError } = await supabase
      .from("product_addons")
      .select("*")
      .eq("product_id", product.id)
      .eq("type", "profit_cost")

    if (checkError) throw checkError

    if (existingAddons && existingAddons.length > 0) {
      // Update existing addon
      const existingAddon = existingAddons[0]
      let contentObj = {}

      try {
        contentObj = JSON.parse(existingAddon.content)
      } catch (e) {
        // If parsing fails, create new content object
        contentObj = {
          show_selling_price: true,
          show_product_cost: true,
          show_profit_margin: true,
          custom_text: "",
        }
      }

      // Update the price values
      contentObj.selling_price = product.selling_price
      contentObj.product_cost = product.product_cost
      contentObj.profit_margin = (product.selling_price - product.product_cost).toFixed(2)

      const { error } = await supabase
        .from("product_addons")
        .update({
          content: JSON.stringify(contentObj, null, 2),
          updated_at: new Date(),
        })
        .eq("id", existingAddon.id)

      if (error) throw error
      console.log("Updated profit_cost addon for product:", product.id)
    } else {
      // Create new addon if it doesn't exist
      await createDefaultProfitCostAddon(product)
    }
  } catch (error) {
    console.error("Error updating profit_cost addon:", error)
    // Don't block product update if addon update fails
  }
}

// Update the convertFormDataToProductData function to handle data conversion more safely
const convertFormDataToProductData = (formData: ProductFormData): Partial<Product> => {
  // Calculate profit margin
  const sellingPrice =
    typeof formData.selling_price === "string" ? Number.parseFloat(formData.selling_price) : formData.selling_price

  const productCost =
    typeof formData.product_cost === "string" ? Number.parseFloat(formData.product_cost) : formData.product_cost

  // Create a clean product object with only the fields we need
  const productData: Partial<Product> = {
    name: formData.name,
    description: formData.description,
    selling_price: sellingPrice,
    product_cost: productCost,
    // Remove profit_margin as it's a generated column
    is_locked: formData.is_locked || (formData.release_time ? true : false), // Lock if release time is set
    images: formData.images || [],
    is_top_product: formData.is_top_product || false,
    priority: formData.priority || 0,
  }

  // Only add release_time if it's provided and valid
  if (formData.release_time) {
    try {
      // Ensure it's a valid date
      const releaseDate = new Date(formData.release_time)
      if (!isNaN(releaseDate.getTime())) {
        productData.release_time = releaseDate.toISOString()
        // If release time is in the future, ensure the product is locked
        if (releaseDate > new Date()) {
          productData.is_locked = true
        }
      }
    } catch (error) {
      console.error("Invalid release_time:", error)
      // Don't add the release_time if it's invalid
    }
  }

  // Only include stats and specifications if they're provided
  if (formData.stats) {
    productData.stats = formData.stats
  }

  if (formData.specifications) {
    productData.specifications = formData.specifications
  }

  return productData
}

// Add pagination state and logic to the AdminProducts component
const AdminProducts: React.FC = () => {
  // State variables
  const [products, setProducts] = useState<ProductWithCategories[]>([])
  const [topProducts, setTopProducts] = useState<ProductWithCategories[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingTopProducts, setLoadingTopProducts] = useState<boolean>(true)
  const [uploading, setUploading] = useState<boolean>(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showAddModal, setShowAddModal] = useState<boolean>(false)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithCategories | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<Category[]>([])
  const [bucketReady, setBucketReady] = useState<boolean>(false)
  const [showTopProductsTab, setShowTopProductsTab] = useState<boolean>(true)
  // Add pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalCount, setTotalCount] = useState<number>(0)

  // Local state for modal form
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    selling_price: "",
    product_cost: "",
    is_locked: false,
    category_ids: [],
    images: [] as string[],
    stats: {
      engagement: "Medium",
      fbAds: "Active",
      targetingInfo: "Available",
      searchVolume: {
        monthly: 0,
        trend: "increasing",
        relatedTerms: [],
      },
      aliexpressOrders: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        trend: "increasing",
      },
    },
    specifications: {
      material: "",
      dimensions: {
        small: "",
        large: "",
      },
    },
    is_top_product: false,
    priority: 0,
    release_time: null, // Add this field
  })
  const [isEditing, setIsEditing] = useState<boolean>(false)

  // ----------------------------
  // Data Fetching
  // ----------------------------

  // Check if the storage bucket exists
  useEffect(() => {
    const checkBucket = async () => {
      const ready = await checkStorageBucket()
      setBucketReady(ready)
      if (!ready) {
        console.error("Cannot access productImages bucket. Please ensure it exists in your Supabase project.")
      }
    }

    checkBucket()
  }, [])

  // Fetch products when component mounts
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { products: productsData, totalCount } = await fetchProductsAPI(currentPage)
      const categoriesData = await fetchCategoriesAPI()

      setProducts(productsData)
      setCategories(categoriesData)
      setTotalCount(totalCount)
      setTotalPages(Math.ceil(totalCount / PRODUCTS_PER_PAGE))
      setLoading(false)
    })()
  }, [currentPage])

  // Fetch top products
  useEffect(() => {
    ;(async () => {
      setLoadingTopProducts(true)
      const topProductsData = await fetchTopProductsAPI()
      setTopProducts(topProductsData)
      setLoadingTopProducts(false)
    })()
  }, [])

  // Add this function to the AdminProducts component
  const refreshProductLocks = async () => {
    try {
      // Call the database function to refresh product locks
      const { error } = await supabase.rpc("refresh_product_locks")

      if (error) {
        console.error("Error refreshing product locks:", error)
        alert(`Error refreshing product locks: ${error.message}`)
        return
      }

      // Refresh the products list
      const { products: productsData, totalCount } = await fetchProductsAPI(currentPage)
      setProducts(productsData)
      setTotalCount(totalCount)
      setTotalPages(Math.ceil(totalCount / PRODUCTS_PER_PAGE))

      // Refresh top products
      const topProductsData = await fetchTopProductsAPI()
      setTopProducts(topProductsData)

      alert("Product locks refreshed successfully")
    } catch (error) {
      console.error("Error refreshing product locks:", error)
      alert(`Error: ${error.message || "Unknown error"}`)
    }
  }

  const handleDeleteProducts = async () => {
    if (!window.confirm("Are you sure you want to delete the selected products?")) return
    const success = await deleteMultipleProductsAPI(selectedProducts)
    if (success) {
      setProducts(products.filter((p) => !selectedProducts.includes(p.id)))
      setTopProducts(topProducts.filter((p) => !selectedProducts.includes(p.id)))
      setSelectedProducts([])
    }
  }

  /**
   * Handle deletion of a single product.
   * @param id - The ID of the product to delete.
   */
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return
    const success = await deleteProductAPI(id)
    if (success) {
      setProducts(products.filter((p) => p.id !== id))
      setTopProducts(topProducts.filter((p) => p.id !== id))
    }
  }

  /**
   * Toggle the lock status of a product.
   * @param product - The product to toggle.
   */
  const toggleLock = async (product: ProductWithCategories) => {
    const updatedProduct = await toggleLockAPI(product)
    if (updatedProduct) {
      setProducts(products.map((p) => (p.id === product.id ? updatedProduct : p)))
      setTopProducts(topProducts.map((p) => (p.id === product.id ? updatedProduct : p)))
    }
  }

  /**
   * Toggle the expansion of a product row to show extra details.
   * @param productId - The product ID to expand/collapse.
   */
  const toggleRowExpansion = (productId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) newSet.delete(productId)
      else newSet.add(productId)
      return newSet
    })
  }

  // Update the resetFormData function to include release_time
  const resetFormData = () => {
    setFormData({
      name: "",
      description: "",
      selling_price: "",
      product_cost: "",
      is_locked: false,
      category_ids: [],
      images: [],
      stats: {
        engagement: "Medium",
        fbAds: "Active",
        targetingInfo: "Available",
        searchVolume: {
          monthly: 0,
          trend: "increasing",
          relatedTerms: [],
        },
        aliexpressOrders: {
          daily: 0,
          weekly: 0,
          monthly: 0,
          trend: "increasing",
        },
      },
      specifications: {
        material: "",
        dimensions: {
          small: "",
          large: "",
        },
      },
      is_top_product: false,
      priority: 0,
      release_time: null, // Add this field
    })
    setIsEditing(false)
    setEditingProduct(null)
  }

  /**
   * Handle image upload and update form data with image URLs.
   * @param files - The files to upload.
   */
  const handleImageUpload = async (files: FileList) => {
    if (!bucketReady) {
      alert("Storage bucket 'productImages' is not accessible. Please check your storage policies.")
      return
    }

    try {
      setUploading(true)

      // Log the files being uploaded
      console.log(
        "Files to upload:",
        Array.from(files).map((f) => ({ name: f.name, type: f.type, size: f.size })),
      )

      const urls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Create a unique file name
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${fileName}`

        console.log(`Uploading file ${i + 1}/${files.length}: ${file.name} as ${filePath}`)

        // Upload the file
        const { data, error } = await supabase.storage.from("productImages").upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        })

        if (error) {
          console.error(`Error uploading file ${file.name}:`, error.message)

          // Check if it's a permissions error
          if (error.message.includes("permission") || error.message.includes("policy")) {
            alert(`Permission denied: ${error.message}. Please check your storage policies.`)
            setUploading(false)
            return
          }

          alert(`Error uploading ${file.name}: ${error.message}`)
          continue
        }

        console.log(`File ${i + 1} uploaded successfully:`, data)

        // Get the public URL
        const { data: publicUrlData } = supabase.storage.from("productImages").getPublicUrl(filePath)

        if (publicUrlData?.publicUrl) {
          console.log(`Public URL for ${filePath}:`, publicUrlData.publicUrl)
          urls.push(publicUrlData.publicUrl)
        } else {
          console.error(`Failed to get public URL for ${filePath}`)
        }
      }

      if (urls.length > 0) {
        console.log("Setting form data with new images:", urls)

        // Update the form data with the new image URLs
        setFormData((prev) => {
          const updatedFormData = {
            ...prev,
            images: [...prev.images, ...urls],
          }
          console.log("Updated form data:", updatedFormData)
          return updatedFormData
        })
      } else {
        alert("No images were uploaded successfully.")
      }
    } catch (error) {
      console.error("Error in handleImageUpload:", error)
      alert(`Error uploading images: ${error.message || "Unknown error"}`)
    } finally {
      setUploading(false)
    }
  }

  // Update the useEffect to handle release_time from the product
  useEffect(() => {
    if (isEditing && editingProduct) {
      console.log("Editing product:", editingProduct)

      // Create a copy of the editing product data
      const formDataFromProduct = {
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        selling_price: editingProduct.selling_price || "",
        product_cost: editingProduct.product_cost || "",
        is_locked: editingProduct.is_locked || false,
        category_ids: editingProduct.categories?.map((c) => c.id) || [],
        images: editingProduct.images || [],
        is_top_product: editingProduct.is_top_product || false,
        priority: editingProduct.priority || 0,
        stats: editingProduct.stats || {
          engagement: "Medium",
          fbAds: "Active",
          targetingInfo: "Available",
          searchVolume: {
            monthly: 0,
            trend: "increasing",
            relatedTerms: [],
          },
          aliexpressOrders: {
            daily: 0,
            weekly: 0,
            monthly: 0,
            trend: "increasing",
          },
        },
        specifications: editingProduct.specifications || {
          material: "",
          dimensions: {
            small: "",
            large: "",
          },
        },
        release_time: null,
      }

      // Format the release_time for the datetime-local input if it exists
      if (editingProduct.release_time) {
        try {
          const date = new Date(editingProduct.release_time)
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DDThh:mm (required format for datetime-local input)
            formDataFromProduct.release_time = date.toISOString().slice(0, 16)
          }
        } catch (error) {
          console.error("Error formatting release_time:", error)
        }
      }

      setFormData(formDataFromProduct)
    }
  }, [isEditing, editingProduct])

  // Update the ProductModal component to include release_time field
  const ProductModal = ({ isEdit = false }: { isEdit?: boolean }) => {
    // Create local state for the form to avoid state update issues
    const [localFormData, setLocalFormData] = useState<ProductFormData>(() => ({ ...formData }))
    const [localUploading, setLocalUploading] = useState<boolean>(false)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    // Use a ref to track if submission is in progress to prevent duplicate submissions
    const isSubmittingRef = useRef<boolean>(false)
    const formRef = useRef<HTMLFormElement>(null)

    // Initialize local form data when modal opens or editing product changes
    useEffect(() => {
      console.log("Initializing form data:", formData)
      // Make a deep copy to avoid reference issues
      const formDataCopy = JSON.parse(JSON.stringify(formData))

      // Format the release_time for the datetime-local input if it exists
      if (formDataCopy.release_time) {
        // Convert to local ISO string and remove the seconds and timezone
        const date = new Date(formDataCopy.release_time)
        formDataCopy.release_time = date.toISOString().slice(0, 16)
      }

      setLocalFormData(formDataCopy)
    }, [isEdit, editingProduct])

    // Handle form submission with a direct approach
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()

      // Prevent multiple submissions
      if (isSubmittingRef.current) {
        console.log("Submission already in progress, ignoring click")
        return
      }

      // Set both the state and ref to indicate submission is in progress
      setIsSubmitting(true)
      isSubmittingRef.current = true

      console.log("Form submission started with data:", localFormData)

      // Use a timeout to ensure UI updates before processing
      setTimeout(() => {
        // Process the form submission directly
        try {
          // Create a copy of the form data to process
          const processedFormData = { ...localFormData }

          // Convert the release_time from local datetime-local format to ISO string if it exists
          if (processedFormData.release_time) {
            processedFormData.release_time = new Date(processedFormData.release_time).toISOString()
          }

          // Convert form data to product data
          const productData = convertFormDataToProductData(processedFormData)
          const categoryIds = processedFormData.category_ids

          console.log("Processing submission:", isEdit ? "edit" : "add")

          if (isEdit) {
            // For editing
            if (!editingProduct) {
              throw new Error("No editing product set")
            }

            // Update the product
            updateProductAPI(editingProduct.id, productData, categoryIds)
              .then((updated) => {
                if (updated) {
                  console.log("Product updated successfully:", updated)

                  // Update the profit_cost addon for this product
                  updateProductProfitCostAddon(updated).then(() => {
                    // Update the products list
                    setProducts((prevProducts) => prevProducts.map((p) => (p.id === editingProduct.id ? updated : p)))

                    // Update top products list if needed
                    if (updated.is_top_product) {
                      setTopProducts((prevTopProducts) => {
                        // Check if product is already in top products
                        const exists = prevTopProducts.some((p) => p.id === updated.id)
                        if (exists) {
                          return prevTopProducts.map((p) => (p.id === updated.id ? updated : p))
                        } else {
                          return [...prevTopProducts, updated]
                        }
                      })
                    } else {
                      // Remove from top products if it's no longer a top product
                      setTopProducts((prevTopProducts) => prevTopProducts.filter((p) => p.id !== updated.id))
                    }

                    // Reset form and close modal
                    resetFormData()
                    setShowEditModal(false)
                    console.log("Edit completed and modal closed")
                  })
                } else {
                  throw new Error("Failed to update product - API returned null")
                }
              })
              .catch((error) => {
                console.error("Error updating product:", error)
                alert(`Error updating product: ${error.message || "Unknown error"}`)
              })
              .finally(() => {
                // Reset submission state
                setIsSubmitting(false)
                isSubmittingRef.current = false
              })
          } else {
            // For adding
            createProductAPI(productData, categoryIds)
              .then((newProduct) => {
                if (newProduct) {
                  console.log("New product created:", newProduct)

                  // Create a default "Profit & Cost" addon for this product
                  createDefaultProfitCostAddon(newProduct).then(() => {
                    // Update the products list
                    setProducts((prevProducts) => [newProduct, ...prevProducts])

                    // Add to top products if it's a top product
                    if (newProduct.is_top_product) {
                      setTopProducts((prevTopProducts) => [...prevTopProducts, newProduct])
                    }

                    // Reset form and close modal
                    resetFormData()
                    setShowAddModal(false)
                    console.log("Product added successfully and modal closed")
                  })
                } else {
                  throw new Error("Failed to create product - API returned null")
                }
              })
              .catch((error) => {
                console.error("Error in handleAddProduct:", error)
                // Show a more detailed error message
                if (error.code) {
                  // This is a Supabase error
                  alert(`Database error (${error.code}): ${error.message || "Unknown error"}`)
                } else {
                  // This is a general error
                  alert(`Error adding product: ${error.message || "Unknown error"}`)
                }
              })
              .finally(() => {
                // Reset submission state
                setIsSubmitting(false)
                isSubmittingRef.current = false
              })
          }
        } catch (error) {
          console.error("Error processing form:", error)
          alert(`Error ${isEdit ? "updating" : "adding"} product: ${error.message || "Unknown error"}`)

          // Reset submission state
          setIsSubmitting(false)
          isSubmittingRef.current = false
        }
      }, 0)
    }

    // Handle image upload directly in the modal component
    const handleLocalImageUpload = async (files: FileList) => {
      if (!bucketReady) {
        alert("Storage bucket 'productImages' is not accessible. Please check your storage policies.")
        return
      }

      try {
        setLocalUploading(true)

        // Log the files being uploaded
        console.log(
          "Files to upload:",
          Array.from(files).map((f) => ({ name: f.name, type: f.type, size: f.size })),
        )

        const urls: string[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          // Create a unique file name
          const fileExt = file.name.split(".").pop()
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `${fileName}`

          console.log(`Uploading file ${i + 1}/${files.length}: ${file.name} as ${filePath}`)

          // Upload the file
          const { data, error } = await supabase.storage.from("productImages").upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          })

          if (error) {
            console.error(`Error uploading file ${file.name}:`, error.message)

            // Check if it's a permissions error
            if (error.message.includes("permission") || error.message.includes("policy")) {
              alert(`Permission denied: ${error.message}. Please check your storage policies.`)
              setLocalUploading(false)
              return
            }

            alert(`Error uploading ${file.name}: ${error.message}`)
            continue
          }

          console.log(`File ${i + 1} uploaded successfully:`, data)

          // Get the public URL
          const { data: publicUrlData } = supabase.storage.from("productImages").getPublicUrl(filePath)

          if (publicUrlData?.publicUrl) {
            console.log(`Public URL for ${filePath}:`, publicUrlData.publicUrl)
            urls.push(publicUrlData.publicUrl)
          } else {
            console.error(`Failed to get public URL for ${filePath}`)
          }
        }

        if (urls.length > 0) {
          console.log("Setting local form data with new images:", urls)

          // Update the local form data with the new image URLs
          setLocalFormData((prev) => {
            const updatedFormData = {
              ...prev,
              images: [...prev.images, ...urls],
            }
            console.log("Updated local form data:", updatedFormData)
            return updatedFormData
          })

          alert(`Successfully uploaded ${urls.length} image(s)`)
        } else {
          alert("No images were uploaded successfully.")
        }
      } catch (error) {
        console.error("Error in handleLocalImageUpload:", error)
        alert(`Error uploading images: ${error.message || "Unknown error"}`)
      } finally {
        setLocalUploading(false)
      }
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">{isEdit ? "Edit Product" : "Add New Product"}</h2>
            <button
              type="button"
              onClick={() => {
                if (!isSubmittingRef.current) {
                  isEdit ? setShowEditModal(false) : setShowAddModal(false)
                  resetFormData()
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={localFormData.name || ""}
                  onChange={(e) => setLocalFormData({ ...localFormData, name: e.target.value })}
                  required
                  className="border p-2 mb-2 w-full"
                  disabled={isSubmitting}
                />
                <textarea
                  placeholder="Product Description"
                  value={localFormData.description || ""}
                  onChange={(e) => setLocalFormData({ ...localFormData, description: e.target.value })}
                  required
                  className="border p-2 mb-2 w-full"
                  disabled={isSubmitting}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Selling Price"
                    value={localFormData.selling_price}
                    onChange={(e) => setLocalFormData({ ...localFormData, selling_price: e.target.value })}
                    required
                    className="border p-2 mb-2 w-full"
                    disabled={isSubmitting}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Product Cost"
                    value={localFormData.product_cost}
                    onChange={(e) => setLocalFormData({ ...localFormData, product_cost: e.target.value })}
                    required
                    className="border p-2 mb-2 w-full"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Add release scheduling section */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="text-md font-medium mb-3">Release Scheduling</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_locked"
                        checked={localFormData.is_locked || false}
                        onChange={(e) => setLocalFormData({ ...localFormData, is_locked: e.target.checked })}
                        disabled={isSubmitting}
                      />
                      <label htmlFor="is_locked">Lock Product (Only Pro users can access)</label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Schedule Release (When should this product be available to free users?)
                      </label>
                      <input
                        type="datetime-local"
                        value={localFormData.release_time || ""}
                        onChange={(e) => setLocalFormData({ ...localFormData, release_time: e.target.value })}
                        className="border p-2 w-full rounded-md"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty for immediate release. Pro users can access locked products immediately.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_top_product"
                        checked={localFormData.is_top_product || false}
                        onChange={(e) => setLocalFormData({ ...localFormData, is_top_product: e.target.checked })}
                        disabled={isSubmitting}
                      />
                      <label htmlFor="is_top_product">Top Product (Always locked for free users)</label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority (For ordering top products)
                      </label>
                      <input
                        type="number"
                        placeholder="Priority"
                        value={localFormData.priority}
                        onChange={(e) => setLocalFormData({ ...localFormData, priority: Number(e.target.value) })}
                        className="border p-2 w-full rounded-md"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher numbers appear first in the top products section.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Multi-select component for categories */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Categories</label>
                  <div className="border p-2 rounded-md max-h-40 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={localFormData.category_ids.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setLocalFormData({
                                ...localFormData,
                                category_ids: [...localFormData.category_ids, category.id],
                              })
                            } else {
                              setLocalFormData({
                                ...localFormData,
                                category_ids: localFormData.category_ids.filter((id) => id !== category.id),
                              })
                            }
                          }}
                          className="rounded border-gray-300"
                          disabled={isSubmitting}
                        />
                        <label htmlFor={`category-${category.id}`} className="text-sm">
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {categories.length === 0 && <p className="text-sm text-gray-500">No categories available</p>}
                </div>
              </div>
            </div>
            {/* Images Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Images</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      // Call the local image upload handler
                      handleLocalImageUpload(e.target.files)
                    }
                  }}
                  className="hidden"
                  id="images"
                  disabled={isSubmitting || localUploading}
                />
                <label
                  htmlFor="images"
                  className={`flex flex-col items-center justify-center ${isSubmitting || localUploading ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                  {localUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 text-gray-400 mb-2 animate-spin" />
                      <span className="text-sm text-gray-500">Uploading images...</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload images</span>
                      <span className="text-xs text-gray-400 mt-1">First image will be used as the main image</span>
                    </>
                  )}
                </label>
              </div>
              {localFormData.images && localFormData.images.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Uploaded Images ({localFormData.images.length})</h4>
                    <p className="text-xs text-gray-500">First image is main</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {localFormData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            // If image fails to load, replace with placeholder
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (!isSubmitting) {
                                const newImages = [...localFormData.images]
                                newImages.splice(index, 1)
                                setLocalFormData({
                                  ...localFormData,
                                  images: newImages,
                                })
                              }
                            }}
                            className="p-1 bg-red-500 text-white rounded-full"
                            disabled={isSubmitting}
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isSubmittingRef.current) {
                    isEdit ? setShowEditModal(false) : setShowAddModal(false)
                    resetFormData()
                  }
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {isEdit ? "Saving..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {isEdit ? "Save Changes" : "Add Product"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Render the Top Products Queue section
  const TopProductsQueue = () => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold">Top Products Queue (Pro Users Only)</h2>
          <p className="text-sm text-gray-600">
            The top 6 products are always locked for free users. Additional top products will be automatically released
            on a weekly schedule.
          </p>
        </div>
        <div className="overflow-x-auto">
          {loadingTopProducts ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : topProducts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No top products found. Add products and mark them as "Top Product".</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Release Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center justify-center h-6 w-6 rounded-full ${
                            index < 6 ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                          } text-xs font-medium`}
                        >
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 mr-3">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(product.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">{product.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.is_locked ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {product.is_locked ? "Locked" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.release_time ? (
                        <div className="text-sm">
                          <div className="font-medium">{new Date(product.release_time).toLocaleDateString()}</div>
                          <div className="text-gray-500">
                            {new Date(product.release_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No release date</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(true)
                            setEditingProduct(product)
                            setShowEditModal(true)
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <button
              onClick={handleDeleteProducts}
              className="inline-flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Selected
            </button>
          )}
          <button
            onClick={refreshProductLocks}
            className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Lock className="h-5 w-5 mr-2" />
            Refresh Locks
          </button>
          <button
            onClick={() => {
              resetFormData()
              setShowAddModal(true)
            }}
            className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setShowTopProductsTab(true)}
          className={`px-4 py-2 font-medium text-sm ${
            showTopProductsTab ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Star className="inline-block h-4 w-4 mr-1" />
          Top Products Queue
        </button>
        <button
          onClick={() => setShowTopProductsTab(false)}
          className={`px-4 py-2 font-medium text-sm ${
            !showTopProductsTab ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Calendar className="inline-block h-4 w-4 mr-1" />
          All Products
        </button>
      </div>

      {/* Show either Top Products Queue or All Products based on tab selection */}
      {showTopProductsTab ? (
        <TopProductsQueue />
      ) : (
        <>
          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
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

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(products.map((p) => p.id))
                          } else {
                            setSelectedProducts([])
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <React.Fragment key={product.id}>
                      {/* Update the products table to display release time */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts([...selectedProducts, product.id])
                              } else {
                                setSelectedProducts(selectedProducts.filter((id) => id !== product.id))
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 mr-3">
                              {product.images?.[0] && (
                                <img
                                  src={product.images[0] || "/placeholder.svg"}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(product.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">${Number.parseFloat(product.selling_price.toString()).toFixed(2)}</td>
                        <td className="px-6 py-4">${Number.parseFloat(product.product_cost.toString()).toFixed(2)}</td>
                        <td className="px-6 py-4">${Number.parseFloat(product.profit_margin.toString()).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.is_locked ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {product.is_locked ? "Locked" : "Active"}
                          </span>
                          {product.release_time && new Date(product.release_time) > new Date() && (
                            <div className="text-xs text-gray-500 mt-1">
                              Releases: {new Date(product.release_time).toLocaleString()}
                            </div>
                          )}
                          {product.is_top_product && (
                            <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              Top
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleLock(product)}
                              className={`p-1.5 transition-colors ${
                                product.is_locked
                                  ? "text-yellow-500 hover:bg-yellow-50"
                                  : "text-green-500 hover:bg-green-50"
                              }`}
                            >
                              {product.is_locked ? <Lock size={18} /> : <Unlock size={18} />}
                            </button>
                            <button
                              onClick={() => {
                                setIsEditing(true)
                                setEditingProduct(product)
                                setShowEditModal(true)
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button
                              onClick={() => toggleRowExpansion(product.id)}
                              className={`p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors ${
                                expandedRows.has(product.id) ? "bg-gray-100" : ""
                              }`}
                            >
                              <ChevronDown
                                size={18}
                                className={`transform transition-transform ${
                                  expandedRows.has(product.id) ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.has(product.id) && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-3 gap-6">
                              {/* Statistics */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Statistics</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Engagement:</span>
                                    <span className="font-medium">{product.stats?.engagement || "N/A"}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">FB Ads:</span>
                                    <span className="font-medium">{product.stats?.fbAds || "N/A"}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Search Volume:</span>
                                    <span className="font-medium">
                                      {product.stats?.searchVolume?.monthly?.toLocaleString() || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {/* Orders */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Aliexpress Orders</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Daily:</span>
                                    <span className="font-medium">
                                      {product.stats?.aliexpressOrders?.daily?.toLocaleString() || "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Weekly:</span>
                                    <span className="font-medium">
                                      {product.stats?.aliexpressOrders?.weekly?.toLocaleString() || "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Monthly:</span>
                                    <span className="font-medium">
                                      {product.stats?.aliexpressOrders?.monthly?.toLocaleString() || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {/* Specifications */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Specifications</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Material:</span>
                                    <span className="font-medium">{product.specifications?.material || "N/A"}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Small Size:</span>
                                    <span className="font-medium">
                                      {product.specifications?.dimensions?.small || "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Large Size:</span>
                                    <span className="font-medium">
                                      {product.specifications?.dimensions?.large || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {/* Categories */}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Categories</h4>
                                <div className="space-y-2">
                                  {product.categories && product.categories.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {product.categories.map((category) => (
                                        <span
                                          key={category.id}
                                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                        >
                                          {category.name}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">No categories assigned</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modals for Adding and Editing Products */}
          {showAddModal && <ProductModal isEdit={false} />}
          {showEditModal && <ProductModal isEdit={true} />}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * PRODUCTS_PER_PAGE + 1}</span> to{" "}
              <span className="font-medium">{Math.min(currentPage * PRODUCTS_PER_PAGE, totalCount)}</span> of{" "}
              <span className="font-medium">{totalCount}</span> Products
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

          {/* Pagination Numbers */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}

          {/* Total Products Count */}
          <div className="text-center mt-6 text-sm text-gray-500">
            Showing {products.length} of {totalCount} products
          </div>
        </>
      )}
    </div>
  )
}

export default AdminProducts

