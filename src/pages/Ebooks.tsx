import { ArrowRight, Bookmark, BookOpen } from "lucide-react";

const ebooks: any = [
  // {
  //   id: 1,
  //   title: '10X YOUR ONLINE STORE SALES',
  //   badges: ['NEW', 'PRO'],
  //   description: 'Learn how to increase your online store sales using various methods like Email marketing, retargeting ads, and by adding trust.',
  //   additionalInfo: "If you're looking for ways to increase your dropshipping store sales practically for FREE, then make sure to check out this e-book!",
  //   image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800",
  //   actionText: 'START READING'
  // },
];

const Ebooks = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 animate-fade-in">
            <BookOpen
              size={32}
              className="text-primary animate-bounce-subtle"
            />
            <h1 className="text-3xl font-bold text-gray-900">
              WinProd E-Books
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ebooks?.length > 0 ? (
            ebooks.map((ebook, index) => (
              <div
                key={ebook.id}
                className="group bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-lg hover:border-primary/20 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Ebook Header with Badges */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={ebook.image}
                    alt={ebook.title}
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80 group-hover:from-black/70 group-hover:to-black/90 transition-colors duration-300" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {ebook.badges.map((badge, index) => (
                      <span
                        key={index}
                        className={`px-2 py-0.5 text-xs font-bold rounded transform hover:scale-105 transition-transform duration-300 ${
                          badge === "PRO"
                            ? "bg-[#FFD700] text-black"
                            : badge === "NEW"
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-black"
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  {ebook.status && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-800 text-gray-200 rounded transform hover:scale-105 transition-transform duration-300">
                        {ebook.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ebook Content */}
                <div className="p-4 space-y-4 bg-white">
                  <h3 className="font-bold text-lg leading-tight text-gray-900 group-hover:text-primary transition-colors duration-300">
                    {ebook.title}
                  </h3>

                  {ebook.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 group-hover:text-gray-900 transition-colors duration-300">
                      {ebook.description}
                    </p>
                  )}

                  {ebook.additionalInfo && (
                    <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                      {ebook.additionalInfo}
                    </p>
                  )}

                  {/* Action Button */}
                  <button
                    className={`w-full py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-md ${
                      ebook.upcoming
                        ? "bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-not-allowed"
                        : ebook.badges.includes("PRO")
                        ? "bg-[#FFD700] hover:bg-[#FFD700]/90 text-black"
                        : "bg-[#47D147] hover:bg-[#47D147]/90 text-white"
                    }`}
                    disabled={ebook.upcoming}
                  >
                    {ebook.actionText ||
                      (ebook.badges.includes("PRO")
                        ? "Upgrade to access"
                        : "Start Reading")}
                    <ArrowRight
                      size={18}
                      className="transform group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 col-span-3">
              <Bookmark size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No eBooks added yet
              </h3>
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
    </div>
  );
};

export default Ebooks;
