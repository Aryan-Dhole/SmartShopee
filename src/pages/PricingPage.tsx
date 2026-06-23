import React from "react";
import { motion } from "motion/react";
import { Check, Sparkles, HelpCircle, ArrowRight, Star } from "lucide-react";
import { useApp } from "../contexts/AppContext";

export default function PricingPage() {
  const { darkMode, setShowAuthModal } = useApp();

  const tiers = [
    {
      name: "Free Hunter",
      price: "₹0",
      description: "Essential intelligence for casual online shoppers.",
      features: [
        "Track up to 5 active price monitors",
        "E-commerce price drop email alerts",
        "Google & Clerk auth secure dashboard",
        "30-day historical price timeline charts",
        "Basic platform comparison matrix",
      ],
      cta: "Get Started Free",
      highlighted: false,
      popular: false
    },
    {
      name: "Smart Pro",
      price: "₹199",
      period: "/ month",
      description: "Unleash full neural intelligence for active deal hunters.",
      features: [
        "Unlimited active price monitors",
        "Real-time instant push notifications",
        "AI Deal Value rating score metrics",
        "AI Buy or Wait recommendation advisor",
        "AI consensus pros/cons review summarizer",
        "Priority multi-platform scraping queue",
      ],
      cta: "Go Smart Pro",
      highlighted: true,
      popular: true
    },
    {
      name: "Business API",
      price: "₹1,499",
      period: "/ month",
      description: "Enterprise grade scrape pipelines and custom integrations.",
      features: [
        "Everything in Smart Pro tier",
        "High frequency webhook price alerts",
        "REST API endpoints query access",
        "Bulk URL paste bulk keyword extraction",
        "Dedicated customer support console",
        "Custom platform integration pipelines",
      ],
      cta: "Contact Enterprise",
      highlighted: false,
      popular: false
    }
  ];

  const faqs = [
    {
      q: "How does PriceWise track prices in real-time?",
      a: "Our system utilizes Gemini AI Search Grounding paired with direct headless scraping interfaces to verify prices across Amazon India, Flipkart, Croma, Vijay Sales, and more than 10 other e-commerce storefronts instantly when you search or alert triggers fire."
    },
    {
      q: "Can I cancel my plan anytime?",
      a: "Yes! Since there is no lock-in contract on our subscription plans, you are free to downgrade or cancel your Smart Pro plan at any billing threshold directly inside your settings panel."
    },
    {
      q: "Is there a limit to how many drops I can track?",
      a: "Free plans can track up to 5 items simultaneously. Upgrading to our Smart Pro tier unlocks unlimited active watchers so you can build a massive tracking matrix."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen px-4 md:px-6 py-12 max-w-7xl mx-auto w-full gap-12">
      
      {/* Hero text */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-mono text-[10px] uppercase tracking-wider">
          <Sparkles size={12} className="animate-pulse" /> Unlock Advanced Shopping Intel
        </div>
        <h1 className={`text-3xl md:text-5xl font-black tracking-tight leading-tight ${darkMode ? "text-white" : "text-neutral-900"}`}>
          Choose the Perfect Tier for Your Shopping Needs
        </h1>
        <p className={`text-sm md:text-base max-w-xl mx-auto leading-relaxed ${darkMode ? "text-white/50" : "text-neutral-500"}`}>
          Start for free to watch your favorite items, or upgrade to Pro to leverage neural buy/wait predictors and real-time deal scoring.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mt-4">
        {tiers.map((tier, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ y: -6 }}
            className={`rounded-3xl border p-8 flex flex-col justify-between relative overflow-hidden transition-all ${
              tier.highlighted
                ? (darkMode
                    ? "bg-[#0c0c14] border-indigo-500/30 shadow-[0_15px_40px_rgba(99,102,241,0.1)]"
                    : "bg-[#f8f9ff] border-indigo-600 shadow-[0_15px_40px_rgba(99,102,241,0.06)]")
                : (darkMode ? "bg-white/[0.02] border-white/5 hover:border-white/10" : "bg-white border-neutral-200 hover:border-neutral-300 shadow-sm")
            }`}
          >
            {tier.popular && (
              <div className="absolute top-4 right-4 bg-indigo-500 text-white text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                Most Popular
              </div>
            )}

            <div>
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${tier.highlighted ? "text-indigo-400" : darkMode ? "text-white/40" : "text-neutral-500"}`}>
                {tier.name}
              </span>
              
              <div className="mt-4 flex items-baseline gap-1">
                <span className={`text-4xl font-black font-mono tracking-tight ${darkMode ? "text-white" : "text-neutral-900"}`}>
                  {tier.price}
                </span>
                {tier.period && (
                  <span className={`text-xs font-mono ${darkMode ? "text-white/40" : "text-neutral-500"}`}>
                    {tier.period}
                  </span>
                )}
              </div>

              <p className={`text-xs mt-3 leading-relaxed ${darkMode ? "text-white/50" : "text-neutral-500"}`}>
                {tier.description}
              </p>

              {/* Features line list */}
              <div className="mt-8 space-y-4">
                {tier.features.map((feat, fidx) => (
                  <div key={fidx} className="flex items-start gap-3 text-xs">
                    <div className={`p-0.5 rounded-full shrink-0 ${tier.highlighted ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      <Check size={12} />
                    </div>
                    <span className={darkMode ? "text-white/70" : "text-neutral-700"}>
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-white/5">
              <button
                onClick={() => setShowAuthModal(true)}
                className={`w-full py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  tier.highlighted
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/15"
                    : (darkMode ? "bg-white/5 hover:bg-white/10 text-white" : "bg-neutral-900 hover:bg-neutral-800 text-white")
                }`}
              >
                {tier.cta} <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQ Accordion list */}
      <div className="max-w-3xl mx-auto w-full mt-12 space-y-6">
        <div className="text-center space-y-2">
          <HelpCircle size={24} className="text-indigo-400 mx-auto" />
          <h2 className={`text-xl font-bold font-mono uppercase tracking-wider ${darkMode ? "text-white" : "text-neutral-900"}`}>
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border ${
              darkMode ? "bg-white/[0.01] border-white/5" : "bg-white border-neutral-200 shadow-sm"
            }`}>
              <h4 className={`text-sm font-bold leading-tight ${darkMode ? "text-white" : "text-neutral-900"}`}>
                {faq.q}
              </h4>
              <p className={`text-xs mt-3 leading-relaxed ${darkMode ? "text-white/50" : "text-neutral-500"}`}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
