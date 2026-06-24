import { motion } from "motion/react";
import { Star, ArrowUpRight, TrendingDown } from "lucide-react";
import { ProductSearchResult } from "../types";

interface ProductCardProps {
  key?: string;
  product: ProductSearchResult;
  onSelect: (p: ProductSearchResult) => void;
  isCompared: boolean;
  onToggleCompare: (product: ProductSearchResult) => void;
  darkMode: boolean;
}

export default function ProductCard({
  product,
  onSelect,
  isCompared,
  onToggleCompare,
  darkMode
}: ProductCardProps) {
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Platform styling helper
  const getPlatformColors = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("amazon")) return { bg: "bg-amber-500/10", text: darkMode ? "text-amber-400" : "text-amber-600", border: "border-amber-500/20" };
    if (p.includes("flipkart")) return { bg: "bg-blue-500/10", text: darkMode ? "text-blue-400" : "text-blue-600", border: "border-blue-500/20" };
    if (p.includes("croma")) return { bg: "bg-teal-500/10", text: darkMode ? "text-teal-400" : "text-teal-600", border: "border-teal-500/20" };
    return { bg: "bg-red-500/10", text: darkMode ? "text-red-400" : "text-red-600", border: "border-red-500/20" };
  };

  // Platform logo URL helper
  const getPlatformLogoUrl = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("amazon")) {
      return "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg";
    }
    if (p.includes("flipkart")) {
      return "https://upload.wikimedia.org/wikipedia/commons/7/7a/Flipkart_logo.svg";
    }
    if (p.includes("myntra")) {
      return "https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.svg";
    }
    if (p.includes("croma")) {
      return "https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Croma_logo.svg/512px-Croma_logo.svg.png";
    }
    if (p.includes("snapdeal")) {
      return "https://upload.wikimedia.org/wikipedia/commons/a/ad/Snapdeal_Logo.svg";
    }
    if (p.includes("blinkit")) {
      return "https://upload.wikimedia.org/wikipedia/commons/c/cf/Blinkit_logo.svg";
    }
    if (p.includes("meesho")) {
      return "https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo_BY_WIKIPEDIA.svg";
    }
    if (p.includes("reliance")) {
      return "https://upload.wikimedia.org/wikipedia/commons/6/69/Reliance_Digital_Logo.svg";
    }
    if (p.includes("vijay")) {
      return "https://www.vijaysales.com/Content/Images/logo.png";
    }
    return "";
  };

  const logoUrl = getPlatformLogoUrl(product.platform);
  const colors = getPlatformColors(product.platform);

  return (
    <motion.div
      layoutId={`product-card-${product.id}`}
      whileHover={{
        y: -5,
        scale: 1.005,
        borderColor: darkMode ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.15)",
        backgroundColor: darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.01)"
      }}
      whileTap={{ scale: 0.995 }}
      className={`group relative flex flex-col overflow-hidden rounded-[26px] border p-5 cursor-pointer backdrop-blur-lg transition-all ${darkMode
          ? "border-neutral-800/80 bg-neutral-900/20 text-neutral-100"
          : "border-neutral-200 bg-white/90 text-neutral-900 shadow-sm"
        }`}
      onClick={() => onSelect(product)}
    >
      {/* Platform Badge */}
      <div className={`absolute top-4 left-4 z-10 flex items-center justify-center rounded-xl px-2.5 py-1.5 backdrop-blur-md border shadow-xs transition-all ${darkMode ? "border-white/10 bg-black/60" : "border-neutral-200 bg-white/90"
        }`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={product.platform}
            referrerPolicy="no-referrer"
            className="h-3.5 w-auto object-contain max-w-[60px]"
            onError={(e) => {
              // Fallback if image fails - show text
              e.currentTarget.style.display = "none";
              const label = e.currentTarget.nextElementSibling as HTMLSpanElement;
              if (label) label.style.display = "inline";
            }}
          />
        ) : null}
        <span className="font-mono text-[8.5px] uppercase tracking-wider font-bold" style={{ display: logoUrl ? "none" : "inline", color: colors.text }}>
          {product.platform}
        </span>
      </div>

      {/* Nothing Brand style Toggle Compare */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleCompare(product);
        }}
        className={`absolute top-4 right-4 z-20 font-mono text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-full border transition-all cursor-pointer ${isCompared
            ? (darkMode
              ? "bg-[#FF0033] border-[#FF0033] text-white"
              : "bg-neutral-900 border-neutral-900 text-white font-bold")
            : (darkMode
              ? "bg-neutral-850 border-neutral-800 text-neutral-400 hover:text-white"
              : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200/80")
          }`}
      >
        {isCompared ? "● Compared" : "○ Compare"}
      </button>

      {/* Image Block */}
      <div className={`relative mb-4 flex h-48 w-full items-center justify-center rounded-2xl border overflow-hidden ${darkMode ? "bg-white/5 border-white/5" : "bg-neutral-50 border-neutral-100/50"
        }`}>
        <img
          src={product.imageUrl}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="h-36 object-contain p-1.5 transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {discountPercent > 0 && (
          <div className="absolute right-3 bottom-3 flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-bold tracking-wider uppercase text-emerald-500 px-2 py-0.5 shadow-sm">
            <TrendingDown size={11} />
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Info Block */}
      <div className="flex flex-1 flex-col">
        <h3 className={`line-clamp-2 text-sm font-semibold tracking-tight ${darkMode ? "text-white/90" : "text-neutral-900"
          }`}>
          {product.title}
        </h3>

        {/* Ratings */}
        <div className={`mt-2.5 flex items-center gap-1 text-xs font-mono grow-0 ${darkMode ? "text-neutral-500" : "text-neutral-400"
          }`}>
          <Star className="fill-yellow-400 stroke-yellow-400" size={12} />
          <span className={`font-bold ${darkMode ? "text-neutral-300" : "text-neutral-700"}`}>
            {Number(product.rating).toFixed(1)}
          </span>
          <span>
            ({product.reviewsCount.toLocaleString()})
          </span>
        </div>

        {/* Pricing */}
        <div className="mt-auto pt-4.5 flex items-end justify-between">
          <div className="flex flex-col text-left">
            {product.originalPrice && (
              <span className={`text-[10px] line-through font-mono ${darkMode ? "text-neutral-600" : "text-neutral-400"
                }`}>
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
            <span className={`text-lg font-black font-mono leading-tight ${darkMode ? "text-neutral-100" : "text-neutral-900"
              }`}>
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className={`flex items-center justify-center rounded-xl h-9.5 w-9.5 border transition-all ${darkMode
                ? "bg-neutral-850 border-neutral-800 text-neutral-400 group-hover:bg-white group-hover:text-black group-hover:border-white"
                : "bg-neutral-100 border-neutral-200 text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-900"
              }`}
          >
            <ArrowUpRight size={16} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
