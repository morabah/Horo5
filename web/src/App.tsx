import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';

const ShopByVibe = lazy(() => import('./pages/ShopByVibe').then((module) => ({ default: module.ShopByVibe })));
const VibeCollection = lazy(() => import('./pages/VibeCollection').then((module) => ({ default: module.VibeCollection })));
const ShopByOccasion = lazy(() => import('./pages/ShopByOccasion').then((module) => ({ default: module.ShopByOccasion })));
const OccasionCollection = lazy(() =>
  import('./pages/OccasionCollection').then((module) => ({ default: module.OccasionCollection })),
);
const ProductDetail = lazy(() => import('./pages/ProductDetail').then((module) => ({ default: module.ProductDetail })));
const Cart = lazy(() => import('./pages/Cart').then((module) => ({ default: module.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then((module) => ({ default: module.Checkout })));
const OrderConfirmation = lazy(() =>
  import('./pages/OrderConfirmation').then((module) => ({ default: module.OrderConfirmation })),
);
const Search = lazy(() => import('./pages/Search').then((module) => ({ default: module.Search })));
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Exchange = lazy(() => import('./pages/Exchange').then((module) => ({ default: module.Exchange })));
const Privacy = lazy(() => import('./pages/Privacy').then((module) => ({ default: module.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then((module) => ({ default: module.Terms })));

function RouteShellFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-papyrus px-6 py-16">
      <p className="font-label text-[10px] font-semibold uppercase tracking-[0.24em] text-label">Loading page</p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteShellFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/vibes" element={<ShopByVibe />} />
          <Route path="/vibes/:slug" element={<VibeCollection />} />
          <Route path="/occasions" element={<ShopByOccasion />} />
          <Route path="/occasions/:slug" element={<OccasionCollection />} />
          <Route path="/artists" element={<Navigate to="/vibes" replace />} />
          <Route path="/artists/:slug" element={<Navigate to="/vibes" replace />} />
          <Route path="/products" element={<Navigate to="/search" replace />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<OrderConfirmation />} />
          <Route path="/search" element={<Search />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
