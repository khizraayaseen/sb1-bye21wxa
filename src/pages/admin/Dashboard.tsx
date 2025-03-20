import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const AdminDashboard = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [isProUser, setIsProUser] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchUserSubscription();
    fetchProducts();
    fetchTopProducts();
    fetchCategories();
  
    // Subscribe to real-time changes
    const subscription = supabase
      .channel("products")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "products" }, (payload) => {
        console.log("New product added:", payload.new);
        setProducts((prevProducts) => [payload.new, ...prevProducts]); // Add new product to list
      })
      .subscribe();
  
    return () => {
      supabase.removeChannel(subscription); // Clean up on unmount
    };
  }, []);
  
  // Fetch user subscription status
  const fetchUserSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: customer } = await supabase
        .from("customers")
        .select("subscription_tier")
        .eq("user_id", user.id)
        .single();
      setIsProUser(customer?.subscription_tier === "pro");
    }
  };

  const fetchProducts = async () => {
    let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  
    if (selectedCategory) {
      query = query.eq("category_id", selectedCategory);
    }
  
    const { data } = await query;
  
    if (data) {
      setProducts(
        data.map((product) => ({
          ...product,
          is_locked: !isProUser && product.release_time && new Date() < new Date(product.release_time),
        }))
      );
    }
  };

  // Fetch top 6 locked products
  const fetchTopProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_top_product", true)
      .order("priority", { ascending: true })
      .limit(6);
    if (data) setTopProducts(data);
  };

  // Fetch categories
  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name", { ascending: true });
    if (data) setCategories(data);
  };

  // Lock products for free users past page 2
  useEffect(() => {
    if (currentPage > 2 && !isProUser) {
      setProducts((prev) => prev.map((p) => ({ ...p, is_locked: true })));
    }
  }, [currentPage, isProUser]);

  // Pagination
  const productsPerPage = 6;
  const totalPages = Math.ceil(products.length / productsPerPage);
  const paginatedProducts = products.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Category Filter */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Categories</h2>
        <div className="flex gap-2">
          <button onClick={() => setSelectedCategory(null)} className="bg-gray-200 px-4 py-2 rounded-lg">
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="bg-gray-200 px-4 py-2 rounded-lg"
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {topProducts.map((product) => (
          <div key={product.id} className="p-4 border rounded-lg">
            <h3 className="text-lg font-bold">{product.name}</h3>
            <p>{product.description}</p>
            <p className="text-sm text-gray-500">Category: {categories.find((c) => c.id === product.category_id)?.name || "Uncategorized"}</p>
          </div>
        ))}
      </div>

      {/* Paginated Products */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {paginatedProducts.map((product) => (
          <div key={product.id} className="p-4 border rounded-lg">
            <h3 className="text-lg font-bold">{product.name}</h3>
            <p>{product.description}</p>
            {!isProUser && product.is_locked && <p className="text-red-500">Locked</p>}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex gap-4">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} className="bg-gray-300 px-4 py-2 rounded-lg">
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} className="bg-gray-300 px-4 py-2 rounded-lg">
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;