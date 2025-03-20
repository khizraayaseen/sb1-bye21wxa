"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "../../lib/supabase"
import {
  DollarSign,
  Search,
  BarChart2,
  Play,
  ExternalLink,
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react"

const AddonTypes = [
  { id: "profit_cost", name: "Your Profit & Cost", icon: <DollarSign className="h-5 w-5" /> },
  { id: "search_volume", name: "Search Volume Analysis", icon: <Search className="h-5 w-5" /> },
  { id: "monthly_revenue", name: "Estimated Monthly Revenue", icon: <BarChart2 className="h-5 w-5" /> },
  { id: "viral_videos", name: "Viral Videos", icon: <Play className="h-5 w-5" /> },
  { id: "marketplace_links", name: "Marketplace Links", icon: <ExternalLink className="h-5 w-5" /> },
  { id: "aliexpress_suppliers", name: "Aliexpress Suppliers", icon: <ShoppingBag className="h-5 w-5" /> },
  { id: "action_buttons", name: "Action Buttons", icon: <ShoppingBag className="h-5 w-5" /> },
]

// Define the addon type fields
const AddonTypeFields = {
  profit_cost: [
    { name: "show_selling_price", label: "Show Selling Price", type: "checkbox", default: true },
    { name: "show_product_cost", label: "Show Product Cost", type: "checkbox", default: true },
    { name: "show_profit_margin", label: "Show Profit Margin", type: "checkbox", default: true },
    { name: "selling_price", label: "Selling Price Value ($)", type: "number", default: 99.99 },
    { name: "product_cost", label: "Product Cost Value ($)", type: "number", default: 49.99 },
    {
      name: "profit_margin_note",
      label: "Profit Margin",
      type: "text",
      default: "Automatically calculated as Selling Price - Product Cost",
      disabled: true,
    },
    { name: "custom_text", label: "Custom Text (optional)", type: "textarea", default: "" },
  ],
  search_volume: [
    { name: "show_monthly_searches", label: "Show Monthly Searches", type: "checkbox", default: true },
    { name: "show_trend", label: "Show Trend", type: "checkbox", default: true },
    { name: "show_related_terms", label: "Show Related Terms", type: "checkbox", default: true },
    { name: "monthly_searches", label: "Monthly Searches Value", type: "number", default: 12500 },
    {
      name: "trend",
      label: "Trend Direction",
      type: "select",
      options: ["increasing", "decreasing"],
      default: "increasing",
    },
    { name: "max_related_terms", label: "Max Related Terms to Show", type: "number", default: 5 },
    {
      name: "related_terms",
      label: "Related Terms (JSON format - include term, volume, and url for each)",
      type: "textarea",
      default: JSON.stringify(
        [
          { term: "LED backpack", volume: 5400, url: "https://google.com/search?q=LED+backpack" },
          {
            term: "Smart backpack with display",
            volume: 3200,
            url: "https://google.com/search?q=Smart+backpack+with+display",
          },
          { term: "Programmable LED bag", volume: 2800, url: "https://google.com/search?q=Programmable+LED+bag" },
          { term: "Backpack with screen", volume: 2100, url: "https://google.com/search?q=Backpack+with+screen" },
          {
            term: "Digital display backpack",
            volume: 1900,
            url: "https://google.com/search?q=Digital+display+backpack",
          },
        ],
        null,
        2,
      ),
    },
  ],
  monthly_revenue: [
    { name: "show_conservative", label: "Show Conservative Estimate", type: "checkbox", default: true },
    { name: "show_realistic", label: "Show Realistic Estimate", type: "checkbox", default: true },
    { name: "show_optimistic", label: "Show Optimistic Estimate", type: "checkbox", default: true },
    { name: "highlight_realistic", label: "Highlight Realistic Estimate", type: "checkbox", default: true },
    { name: "conservative_sales", label: "Conservative Monthly Sales", type: "number", default: 50 },
    { name: "realistic_sales", label: "Realistic Monthly Sales", type: "number", default: 100 },
    { name: "optimistic_sales", label: "Optimistic Monthly Sales", type: "number", default: 200 },
    // Add direct revenue value fields
    { name: "conservative_revenue", label: "Conservative Monthly Revenue ($)", type: "number", default: 2500 },
    { name: "realistic_revenue", label: "Realistic Monthly Revenue ($)", type: "number", default: 5000 },
    { name: "optimistic_revenue", label: "Optimistic Monthly Revenue ($)", type: "number", default: 10000 },
    {
      name: "use_custom_revenue",
      label: "Use Custom Revenue Values (instead of calculated)",
      type: "checkbox",
      default: false,
    },
    { name: "profit_per_sale", label: "Profit Per Sale ($)", type: "number", default: 50 },
  ],
  viral_videos: [
    {
      name: "video_urls",
      label: "Video URLs (one per line)",
      type: "textarea",
      default:
        "https://www.tiktok.com/t/ZT29xucKT/\nhttps://www.tiktok.com/t/ZT29xucKT/\nhttps://www.tiktok.com/t/ZT29xucKT/",
    },
    { name: "max_videos", label: "Maximum Videos to Display", type: "number", default: 5 },
    { name: "show_views", label: "Show View Count", type: "checkbox", default: true },
  ],
  marketplace_links: [
    {
      name: "links",
      label: "Links (JSON format)",
      type: "textarea",
      default: JSON.stringify(
        [
          { platform: "Amazon", url: "https://amazon.com/dp/B0123456789" },
          { platform: "eBay", url: "https://ebay.com/itm/123456789" },
          { platform: "Alibaba", url: "https://alibaba.com/product/123456789" },
          { platform: "AliExpress", url: "https://aliexpress.com/item/123456789" },
        ],
        null,
        2,
      ),
    },
  ],
  aliexpress_suppliers: [
    {
      name: "suppliers",
      label: "Suppliers (JSON format)",
      type: "textarea",
      default: JSON.stringify(
        [
          { name: "Tech Gadgets Supplier", url: "https://aliexpress.com/supplier/123" },
          { name: "LED Accessories Co.", url: "https://aliexpress.com/supplier/456" },
          { name: "Smart Bags Factory", url: "https://aliexpress.com/supplier/789" },
          { name: "Outdoor Gear Direct", url: "https://aliexpress.com/supplier/101" },
        ],
        null,
        2,
      ),
    },
  ],
  action_buttons: [
    { name: "show_aliexpress_button", label: "Show 'See on Aliexpress' Button", type: "checkbox", default: true },
    { name: "aliexpress_button_text", label: "Aliexpress Button Text", type: "text", default: "See on Aliexpress" },
    { name: "aliexpress_button_url", label: "Aliexpress Button URL", type: "text", default: "https://aliexpress.com" },
    { name: "show_shopify_button", label: "Show 'Sell with Shopify' Button", type: "checkbox", default: true },
    { name: "shopify_button_text", label: "Shopify Button Text", type: "text", default: "Sell with Shopify" },
    { name: "shopify_button_url", label: "Shopify Button URL", type: "text", default: "https://shopify.com" },
  ],
}

const AdminAddons = () => {
  const [activeTab, setActiveTab] = useState("profit_cost")
  const [addons, setAddons] = useState({})
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [currentAddon, setCurrentAddon] = useState(null)
  const [formData, setFormData] = useState({
    type: "profit_cost",
    title: "",
    content: "{}",
    enabled: true,
    order: 0, // Changed from display_order to order to match DB schema
    product_id: null, // Add product_id field
  })

  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [filterByProduct, setFilterByProduct] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
    fetchAddons()
  }, [])

  useEffect(() => {
    fetchAddons()
  }, [selectedProductId, filterByProduct])

  useEffect(() => {
    if (formData.product_id) {
      fetchProductData(formData.product_id)
    } else {
      setSelectedProduct(null)
    }
  }, [formData.product_id])

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("id, name").order("name", { ascending: true })
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error.message)
    }
  }

  const fetchProductData = async (productId) => {
    if (!productId) {
      setSelectedProduct(null)
      return
    }

    try {
      const { data, error } = await supabase.from("products").select("*").eq("id", productId).single()

      if (error) throw error
      setSelectedProduct(data)
    } catch (error) {
      console.error("Error fetching product data:", error.message)
      setSelectedProduct(null)
    }
  }

  const fetchAddons = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from("product_addons").select("*").order("order", { ascending: true })

      // Filter by product if selected
      if (filterByProduct && selectedProductId) {
        query = query.eq("product_id", selectedProductId)
      } else if (filterByProduct) {
        query = query.is("product_id", null)
      }

      const { data, error } = await query

      if (error) throw error

      // Group addons by type, prioritizing product-specific ones
      const groupedAddons = {}
      AddonTypes.forEach((type) => {
        // Get all addons of this type
        const typeAddons = data.filter((addon) => addon.type === type.id)

        // Sort to prioritize product-specific addons over global ones
        typeAddons.sort((a, b) => {
          // If one is product-specific and the other is global, prioritize product-specific
          if (a.product_id && !b.product_id) return -1
          if (!a.product_id && b.product_id) return 1
          // Otherwise sort by order
          return a.order - b.order
        })

        groupedAddons[type.id] = typeAddons
      })

      setAddons(groupedAddons)
    } catch (error) {
      console.error("Error fetching addons:", error.message)
    } finally {
      setLoading(false)
    }
  }, [selectedProductId, filterByProduct])

  const handleAddNew = () => {
    // Find the highest order for this type
    let maxOrder = 0
    if (addons[activeTab] && addons[activeTab].length > 0) {
      maxOrder = Math.max(...addons[activeTab].map((addon) => addon.order || 0)) // Changed from display_order to order
    }

    // Create default content object from fields
    const defaultContent = {}
    if (AddonTypeFields[activeTab]) {
      AddonTypeFields[activeTab].forEach((field) => {
        defaultContent[field.name] = field.default
      })
    }

    // If this is a profit_cost addon and a product is selected, use product data
    if (activeTab === "profit_cost" && selectedProductId) {
      fetchProductData(selectedProductId).then(() => {
        if (selectedProduct) {
          defaultContent.selling_price = selectedProduct.selling_price
          defaultContent.product_cost = selectedProduct.product_cost
          defaultContent.profit_margin = (selectedProduct.selling_price - selectedProduct.product_cost).toFixed(2)
        }
      })
    }

    setCurrentAddon(null)
    setFormData({
      type: activeTab,
      title: AddonTypes.find((t) => t.id === activeTab)?.name || "",
      content: JSON.stringify(defaultContent, null, 2),
      enabled: true,
      order: maxOrder + 1, // Changed from display_order to order
      product_id: selectedProductId, // Set product_id from selected product
    })
    setEditMode(true)
  }

  const handleEdit = (addon) => {
    setCurrentAddon(addon)

    // Parse the content if it's JSON
    let parsedContent = {}
    try {
      if (addon.content) {
        parsedContent = JSON.parse(addon.content)
      }
    } catch (e) {
      console.error("Error parsing addon content:", e)
      // If parsing fails, just use the raw content
      parsedContent = addon.content
    }

    setFormData({
      type: addon.type,
      title: addon.title,
      content: typeof parsedContent === "object" ? JSON.stringify(parsedContent, null, 2) : addon.content,
      enabled: addon.enabled,
      order: addon.order || 0, // Changed from display_order to order
      product_id: addon.product_id, // Include product_id
    })
    setEditMode(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this addon?")) return

    try {
      const { error } = await supabase.from("product_addons").delete().eq("id", id)

      if (error) throw error

      fetchAddons()
    } catch (error) {
      console.error("Error deleting addon:", error.message)
      alert(`Error deleting addon: ${error.message}`)
    }
  }

  const handleSave = async () => {
    try {
      // Validate JSON content if it's supposed to be JSON
      let contentToSave = formData.content
      try {
        // Try to parse it to validate it's proper JSON
        const contentObj = JSON.parse(formData.content)

        // If this is a profit_cost addon and a product is selected, ensure product data is used
        if (formData.type === "profit_cost" && formData.product_id && selectedProduct) {
          contentObj.selling_price = selectedProduct.selling_price
          contentObj.product_cost = selectedProduct.product_cost
          contentObj.profit_margin = (selectedProduct.selling_price - selectedProduct.product_cost).toFixed(2)
          contentToSave = JSON.stringify(contentObj, null, 2)
        }

        // Ensure numeric values are properly converted for monthly_revenue
        if (formData.type === "monthly_revenue") {
          if (contentObj.conservative_revenue) contentObj.conservative_revenue = Number(contentObj.conservative_revenue)
          if (contentObj.realistic_revenue) contentObj.realistic_revenue = Number(contentObj.realistic_revenue)
          if (contentObj.optimistic_revenue) contentObj.optimistic_revenue = Number(contentObj.optimistic_revenue)
          if (contentObj.profit_per_sale) contentObj.profit_per_sale = Number(contentObj.profit_per_sale)
          contentToSave = JSON.stringify(contentObj, null, 2)
        }

        // If we get here, it's valid JSON
      } catch (e) {
        // If it's not valid JSON, check if we're dealing with a field that should be JSON
        const fields = AddonTypeFields[formData.type] || []
        const hasJsonField = fields.some(
          (field) =>
            (field.name === "links" || field.name === "suppliers" || field.name === "related_terms") &&
            field.type === "textarea",
        )

        if (hasJsonField) {
          alert("Invalid JSON format. Please check your formatting.")
          return
        }
      }

      // Add updated_at timestamp
      const dataToSave = {
        type: formData.type,
        title: formData.title,
        content: contentToSave,
        enabled: formData.enabled,
        order: formData.order, // Changed from display_order to order
        updated_at: new Date(),
        product_id: formData.product_id, // Include product_id
      }

      if (currentAddon) {
        // Update existing addon
        const { error } = await supabase.from("product_addons").update(dataToSave).eq("id", currentAddon.id)

        if (error) throw error
      } else {
        // Create new addon
        const { error } = await supabase.from("product_addons").insert([dataToSave])

        if (error) throw error
      }

      setEditMode(false)
      fetchAddons()
    } catch (error) {
      console.error("Error saving addon:", error.message)
      alert(`Error saving addon: ${error.message}`)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleContentFieldChange = (fieldName, value, fieldType) => {
    try {
      // Parse current content
      let contentObj
      try {
        contentObj = JSON.parse(formData.content)
      } catch (e) {
        // If not valid JSON, start with empty object
        contentObj = {}
      }

      // Update the specific field
      contentObj[fieldName] = fieldType === "checkbox" ? value : fieldType === "number" ? Number(value) : value

      // Update the form data with the new content
      setFormData({
        ...formData,
        content: JSON.stringify(contentObj, null, 2),
      })
    } catch (e) {
      console.error("Error updating content field:", e)
    }
  }

  const handleProfitCostChange = (fieldName, value) => {
    try {
      // Parse current content
      let contentObj
      try {
        contentObj = JSON.parse(formData.content)
      } catch (e) {
        contentObj = {}
      }

      // Update the specific field
      contentObj[fieldName] = Number(value)

      // If this is selling_price or product_cost, recalculate profit_margin
      if (fieldName === "selling_price" || fieldName === "product_cost") {
        const sellingPrice = fieldName === "selling_price" ? Number(value) : contentObj.selling_price || 0
        const productCost = fieldName === "product_cost" ? Number(value) : contentObj.product_cost || 0

        // Calculate and update profit margin
        contentObj.profit_margin = (sellingPrice - productCost).toFixed(2)
      }

      // Update the form data with the new content
      setFormData({
        ...formData,
        content: JSON.stringify(contentObj, null, 2),
      })
    } catch (e) {
      console.error("Error updating profit cost field:", e)
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from("product_addons")
        .update({
          enabled: !currentStatus,
          updated_at: new Date(),
        })
        .eq("id", id)

      if (error) throw error

      fetchAddons()
    } catch (error) {
      console.error("Error updating addon status:", error.message)
      alert(`Error updating addon status: ${error.message}`)
    }
  }

  // Render form fields based on addon type
  const renderFormFields = () => {
    if (!formData.type) return null

    const fields = AddonTypeFields[formData.type]
    if (!fields) return null

    let contentObj = {}
    try {
      contentObj = JSON.parse(formData.content)
    } catch (e) {
      console.error("Error parsing content:", e)
    }

    return (
      <div className="space-y-4">
        {fields.map((field, index) => {
          const value = contentObj[field.name] !== undefined ? contentObj[field.name] : field.default

          switch (field.type) {
            case "text":
              return (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleContentFieldChange(field.name, e.target.value, field.type)}
                    disabled={field.disabled}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 ${field.disabled ? "bg-gray-100 text-gray-500 italic" : ""}`}
                    placeholder={field.label}
                  />
                </div>
              )
            case "textarea":
              return (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <textarea
                    value={value}
                    onChange={(e) => handleContentFieldChange(field.name, e.target.value, field.type)}
                    rows={5}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder={field.label}
                  />
                </div>
              )
            case "number":
              // For profit_cost addon, use product data for selling_price and product_cost
              const isProductSpecificField =
                formData.type === "profit_cost" &&
                formData.product_id &&
                selectedProduct &&
                (field.name === "selling_price" || field.name === "product_cost")

              // Use product data if available for these fields
              let fieldValue = value
              let isDisabled = field.disabled

              if (isProductSpecificField) {
                if (field.name === "selling_price") {
                  fieldValue = selectedProduct.selling_price
                  isDisabled = true
                } else if (field.name === "product_cost") {
                  fieldValue = selectedProduct.product_cost
                  isDisabled = true
                }
              }

              return (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type="number"
                    value={fieldValue}
                    disabled={isDisabled}
                    onChange={(e) => {
                      if (
                        formData.type === "profit_cost" &&
                        (field.name === "selling_price" || field.name === "product_cost")
                      ) {
                        handleProfitCostChange(field.name, e.target.value)
                      } else {
                        handleContentFieldChange(field.name, e.target.value, field.type)
                      }
                    }}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 ${isDisabled ? "bg-gray-100 text-gray-500 italic" : ""}`}
                    placeholder={field.label}
                  />
                  {isProductSpecificField && <p className="text-xs text-gray-500 mt-1">Using value from product</p>}
                </div>
              )
            case "select":
              return (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <select
                    value={value}
                    onChange={(e) => handleContentFieldChange(field.name, e.target.value, field.type)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {field.options?.map((option, optIndex) => (
                      <option key={optIndex} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )
            case "checkbox":
              return (
                <div key={index} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleContentFieldChange(field.name, e.target.checked, field.type)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">{field.label}</label>
                </div>
              )
            default:
              return null
          }
        })}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Manage Product Addons</h1>
          {!editMode && (
            <button
              onClick={handleAddNew}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={18} />
              Add New Addon
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="filterByProduct"
              checked={filterByProduct}
              onChange={(e) => setFilterByProduct(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="filterByProduct" className="text-sm font-medium text-gray-700">
              Filter by product
            </label>
          </div>

          <div className="flex-1 max-w-md">
            <select
              value={selectedProductId || ""}
              onChange={(e) => setSelectedProductId(e.target.value || null)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={!filterByProduct}
            >
              <option value="">Global Addons (All Products)</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {editMode ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {currentAddon
                ? `Edit ${AddonTypes.find((t) => t.id === formData.type)?.name}`
                : `Create New ${AddonTypes.find((t) => t.id === formData.type)?.name}`}
            </h2>
            <button onClick={() => setEditMode(false)} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Addon Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                disabled={currentAddon}
              >
                {AddonTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter section title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apply to Product</label>
              <select
                value={formData.product_id || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, product_id: e.target.value || null }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Global (All Products)</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Render dynamic fields based on addon type */}
            {renderFormFields()}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter display order"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">Enabled</label>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Save size={18} />
                Save Addon
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="flex overflow-x-auto">
              {AddonTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActiveTab(type.id)}
                  className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap ${
                    activeTab === type.id
                      ? "border-b-2 border-primary text-primary"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {type.icon}
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
              <p className="ml-3 mt-2">Loading Addons...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md">
              {addons[activeTab]?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Display Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {addons[activeTab].map((addon) => (
                        <tr key={addon.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{addon.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {addon.product_id
                                ? products.find((p) => p.id === addon.product_id)?.name || "Unknown Product"
                                : "Global (All Products)"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{addon.order}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(addon.id, addon.enabled)}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                addon.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {addon.enabled ? "Enabled" : "Disabled"}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button onClick={() => handleEdit(addon)} className="text-blue-600 hover:text-blue-900">
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(addon.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-500 mb-4">No addons found for this section</p>
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Add Your First Addon
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminAddons

