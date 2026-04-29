/**
 * useWishlist — consumes WishlistContext.
 * State is owned by WishlistProvider (in AppProviders) so every consumer
 * — Nav, MerchProductCard, PdpBuyBox, Wishlist page — shares a single
 * React state instance rather than each maintaining their own localStorage read.
 */
export { useWishlist } from '../context/WishlistContext';
