import { Suspense, lazy, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnalyticsRoot } from './analytics/AnalyticsRoot';
import { Layout } from './components/Layout';

const Home = lazy(async () => ({ default: (await import('./pages/Home')).Home }));
const ShopByVibe = lazy(async () => ({ default: (await import('./pages/ShopByVibe')).ShopByVibe }));
const VibeCollection = lazy(async () => ({ default: (await import('./pages/VibeCollection')).VibeCollection }));
const ShopByOccasion = lazy(async () => ({ default: (await import('./pages/ShopByOccasion')).ShopByOccasion }));
const OccasionCollection = lazy(async () => ({ default: (await import('./pages/OccasionCollection')).OccasionCollection }));
const ProductDetail = lazy(async () => ({ default: (await import('./pages/ProductDetail')).ProductDetail }));
const Cart = lazy(async () => ({ default: (await import('./pages/Cart')).Cart }));
const Checkout = lazy(async () => ({ default: (await import('./pages/Checkout')).Checkout }));
const OrderConfirmation = lazy(async () => ({ default: (await import('./pages/OrderConfirmation')).OrderConfirmation }));
const Search = lazy(async () => ({ default: (await import('./pages/Search')).Search }));
const NotFound = lazy(async () => ({ default: (await import('./pages/NotFound')).NotFound }));
const About = lazy(async () => ({ default: (await import('./pages/About')).About }));
const Exchange = lazy(async () => ({ default: (await import('./pages/Exchange')).Exchange }));
const Privacy = lazy(async () => ({ default: (await import('./pages/Privacy')).Privacy }));
const Terms = lazy(async () => ({ default: (await import('./pages/Terms')).Terms }));

function RouteLoadingFallback() {
  return (
    <div className="container py-12">
      <p className="font-body text-warm-charcoal">Loading...</p>
    </div>
  );
}

function RoutePage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <>
      <AnalyticsRoot />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<RoutePage><Home /></RoutePage>} />
          <Route path="/about" element={<RoutePage><About /></RoutePage>} />
          <Route path="/exchange" element={<RoutePage><Exchange /></RoutePage>} />
          <Route path="/privacy" element={<RoutePage><Privacy /></RoutePage>} />
          <Route path="/terms" element={<RoutePage><Terms /></RoutePage>} />
          <Route path="/vibes" element={<RoutePage><ShopByVibe /></RoutePage>} />
          <Route path="/vibes/:slug" element={<RoutePage><VibeCollection /></RoutePage>} />
          <Route path="/occasions" element={<RoutePage><ShopByOccasion /></RoutePage>} />
          <Route path="/occasions/:slug" element={<RoutePage><OccasionCollection /></RoutePage>} />
          <Route path="/artists" element={<Navigate to="/vibes" replace />} />
          <Route path="/artists/:slug" element={<Navigate to="/vibes" replace />} />
          <Route path="/products" element={<Navigate to="/search" replace />} />
          <Route path="/products/:slug" element={<RoutePage><ProductDetail /></RoutePage>} />
          <Route path="/cart" element={<RoutePage><Cart /></RoutePage>} />
          <Route path="/checkout" element={<RoutePage><Checkout /></RoutePage>} />
          <Route path="/checkout/success" element={<RoutePage><OrderConfirmation /></RoutePage>} />
          <Route path="/search" element={<RoutePage><Search /></RoutePage>} />
          <Route path="*" element={<RoutePage><NotFound /></RoutePage>} />
        </Route>
      </Routes>
    </>
  );
}
