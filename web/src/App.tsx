import { Suspense, lazy, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnalyticsRoot } from './analytics/AnalyticsRoot';
import { Layout } from './components/Layout';
import { RouteLoadingSpinner } from './components/RouteLoadingSpinner';
import { LegacyVibeCollectionRedirect } from './routes/LegacyVibeRedirect';

const Home = lazy(async () => ({ default: (await import('./pages/Home')).Home }));
const ShopByFeeling = lazy(async () => ({ default: (await import('./pages/ShopByFeeling')).ShopByFeeling }));
const FeelingCollection = lazy(async () => ({ default: (await import('./pages/FeelingCollection')).FeelingCollection }));
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

function RoutePage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoadingSpinner />}>{children}</Suspense>;
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
          <Route path="/feelings" element={<RoutePage><ShopByFeeling /></RoutePage>} />
          <Route path="/feelings/:slug/:subfeelingSlug" element={<RoutePage><FeelingCollection /></RoutePage>} />
          <Route path="/feelings/:slug" element={<RoutePage><FeelingCollection /></RoutePage>} />
          <Route path="/vibes" element={<Navigate to="/feelings" replace />} />
          <Route path="/vibes/:slug" element={<LegacyVibeCollectionRedirect />} />
          <Route path="/occasions" element={<RoutePage><ShopByOccasion /></RoutePage>} />
          <Route path="/occasions/:slug" element={<RoutePage><OccasionCollection /></RoutePage>} />
          <Route path="/artists" element={<Navigate to="/feelings" replace />} />
          <Route path="/artists/:slug" element={<Navigate to="/feelings" replace />} />
          <Route path="/products" element={<RoutePage><Search /></RoutePage>} />
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
