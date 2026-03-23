import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ShopByVibe } from './pages/ShopByVibe';
import { VibeCollection } from './pages/VibeCollection';
import { ShopByOccasion } from './pages/ShopByOccasion';
import { OccasionCollection } from './pages/OccasionCollection';
import { BrowseByArtist } from './pages/BrowseByArtist';
import { ArtistProfile } from './pages/ArtistProfile';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Search } from './pages/Search';
import { NotFound } from './pages/NotFound';
import { About } from './pages/About';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/vibes" element={<ShopByVibe />} />
        <Route path="/vibes/:slug" element={<VibeCollection />} />
        <Route path="/occasions" element={<ShopByOccasion />} />
        <Route path="/occasions/:slug" element={<OccasionCollection />} />
        <Route path="/artists" element={<BrowseByArtist />} />
        <Route path="/artists/:slug" element={<ArtistProfile />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/success" element={<OrderConfirmation />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
