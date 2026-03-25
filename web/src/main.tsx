import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './cart/CartContext';
import { UiLocaleProvider } from './i18n/ui-locale';
import './index.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <UiLocaleProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </UiLocaleProvider>
    </BrowserRouter>
  </StrictMode>
);
