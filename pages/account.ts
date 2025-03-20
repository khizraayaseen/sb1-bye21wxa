// "use client"

// import { useState, useEffect } from "react"
// import { useRouter } from "next/router"
// import { supabase } from "@/lib/supabase"
// import Layout from "@/components/Layout"
// import AccountDetails from "@/components/account/AccountDetails"
// import SubscriptionDetails from "@/components/account/SubscriptionDetails"
// import BillingHistory from "@/components/account/BillingHistory"
// import AccountSecurity from "@/components/account/AccountSecurity"
// import LoadingSpinner from "@/components/ui/LoadingSpinner"

// export default function AccountPage() {
//   const router = useRouter()
//   const [user, setUser] = useState(null)
//   const [profile, setProfile] = useState(null)
//   const [subscription, setSubscription] = useState(null)
//   const [billingHistory, setBillingHistory] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [activeTab, setActiveTab] = useState("details")

//   useEffect(() => {
//     async function loadUserData() {
//       try {
//         setLoading(true)

//         // Get current user
//         const {
//           data: { user: currentUser },
//         } = await supabase.auth.getUser()

//         if (!currentUser) {
//           router.push("/login")
//           return
//         }

//         setUser(currentUser)

//         // Fetch user profile
//         const { data: profileData, error: profileError } = await supabase
//           .from("profiles")
//           .select("*")
//           .eq("id", currentUser.id)
//           .single()

//         if (profileError) {
//           console.error("Error fetching profile:", profileError)
//         } else {
//           setProfile(profileData)
//         }

//         // Fetch subscription data
//         const { data: subscriptionData, error: subscriptionError } = await supabase
//           .from("subscriptions")
//           .select("*, subscription_items(*)")
//           .eq("user_id", currentUser.id)
//           .order("created_at", { ascending: false })
//           .limit(1)
//           .single()

//         if (subscriptionError && subscriptionError.code !== "PGRST116") {
//           console.error("Error fetching subscription:", subscriptionError)
//         } else if (subscriptionData) {
//           setSubscription(subscriptionData)
//         }

//         // Fetch billing history
//         const { data: billingData, error: billingError } = await supabase
//           .from("payments")
//           .select("*")
//           .eq("user_id", currentUser.id)
//           .order("created_at", { ascending: false })

//         if (billingError) {
//           console.error("Error fetching billing history:", billingError)
//         } else {
//           setBillingHistory(billingData || [])
//         }
//       } catch (error) {
//         console.error("Error loading user data:", error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     loadUserData()
//   }, [router])

//   const tabs = [
//     { id: "details", label: "Account Details" },
//     { id: "subscription", label: "Subscription" },
//     { id: "billing", label: "Billing History" },
//     { id: "security", label: "Security" },
//   ]

//   if (loading) {
//     return (
//       <Layout>
//         <div className="flex justify-center items-center min-h-[60vh]">
//           <LoadingSpinner size="large" />
//         </div>
//       </Layout>
//     )
//   }

//   return (
//     <Layout>
//       <div className="container mx-auto px-4 py-8">
//         <h1 className="text-3xl font-bold mb-8">My Account</h1>

//         <div className="mb-8 border-b border-gray-200">
//           <div className="flex flex-wrap -mb-px">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
//                   activeTab === tab.id
//                     ? "border-primary text-primary"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//                 onClick={() => setActiveTab(tab.id)}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="bg-white rounded-lg shadow p-6">
//           {activeTab === "details" && <AccountDetails user={user} profile={profile} />}
//           {activeTab === "subscription" && <SubscriptionDetails subscription={subscription} />}
//           {activeTab === "billing" && <BillingHistory billingHistory={billingHistory} />}
//           {activeTab === "security" && <AccountSecurity user={user} />}
//         </div>
//       </div>
//     </Layout>
//   )
// }

