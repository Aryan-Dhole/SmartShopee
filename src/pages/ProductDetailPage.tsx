import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ExternalLink, Star, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { ProductSearchResult } from '../types';
import ProductDetailModal from '../components/ProductDetailModal';

/**
 * ProductDetailPage — Dedicated route for viewing product details.
 * Receives product data via React Router state (passed from search results).
 * Renders the ProductDetailModal content as a full-page experience.
 */
export default function ProductDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser, addNotification, darkMode } = useApp();

  // Product data is passed via router state from SearchPage
  const product = location.state?.product as ProductSearchResult | undefined;

  // If no product data in state (e.g. direct URL navigation), show fallback
  if (!product) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] px-6 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-neutral-100 border border-neutral-200'}`}>
            <ExternalLink className={darkMode ? 'text-white/30' : 'text-neutral-400'} size={28} />
          </div>
          <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
          <p className={`text-sm mb-6 ${darkMode ? 'text-white/40' : 'text-neutral-500'}`}>
            This product page requires data from a search. Try searching for a product first.
          </p>
          <button
            onClick={() => navigate('/search')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all"
          >
            Go to Search
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Back navigation bar */}
      <div className={`sticky top-0 z-30 border-b backdrop-blur-xl ${darkMode ? 'border-white/5 bg-[#050505]/80' : 'border-neutral-200 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              darkMode
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <ArrowLeft size={14} />
            Back to results
          </button>

          <div className="flex-1 min-w-0">
            <p className={`text-xs font-mono truncate ${darkMode ? 'text-white/30' : 'text-neutral-400'}`}>
              {product.platform} · {product.title.substring(0, 60)}...
            </p>
          </div>

          {/* Quick price badge */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border ${darkMode ? 'border-white/10 bg-white/5' : 'border-neutral-200 bg-white'}`}>
            {product.originalPrice && (
              <span className={`text-[10px] line-through font-mono ${darkMode ? 'text-white/30' : 'text-neutral-400'}`}>
                ₹{product.originalPrice.toLocaleString("en-IN")}
              </span>
            )}
            <span className={`text-sm font-black font-mono ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] font-bold text-emerald-500">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Modal rendered inline (not as overlay) */}
      <ProductDetailModal
        product={product}
        onClose={() => navigate(-1)}
        isLoggedIn={!!currentUser}
        onAlertCreated={() => {
          addNotification({
            id: Date.now().toString(),
            title: '✅ Price Alert Set',
            message: `We'll notify you when ${product.title} drops below your target.`,
            productName: product.title,
            priceTag: `₹${product.price}`,
            platform: product.platform,
            type: 'alert',
          });
        }}
        darkMode={darkMode}
        renderAsPage={true}
      />
    </div>
  );
}
