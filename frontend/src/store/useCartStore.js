import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ product, quantity }]

      setCartItems: (items) => set({ items: Array.isArray(items) ? items : [] }),

      addItem: (product, quantity = null) => {
        const moq = Math.max(1, parseInt(product.minimum_order_quantity || product.min_quantity || 1, 10));
        const items = get().items;

        // Unit compatibility validation
        const productUnit = (product.unit_name || product.unit || 'Meter').trim();
        if (items.length > 0) {
          const existingUnit = (items[0].product.unit_name || items[0].product.unit || 'Meter').trim();
          if (existingUnit.toLowerCase() !== productUnit.toLowerCase()) {
            return {
              success: false,
              message: `Cannot mix different selling units in one cart. Your cart currently contains "${existingUnit}" products. Please checkout or clear existing cart items.`
            };
          }
        }

        const existing = items.find(
          i => String(i.product.id) === String(product.id) ||
               (i.product.cart_item_id && String(i.product.cart_item_id) === String(product.cart_item_id))
        );

        if (existing) {
          // Subsequent addition: increment by 1 unit (or specified quantity)
          const addQty = quantity !== null ? Math.max(1, parseInt(quantity, 10) || 1) : 1;
          set({
            items: items.map(i =>
              (String(i.product.id) === String(product.id) ||
               (i.product.cart_item_id && String(i.product.cart_item_id) === String(product.cart_item_id)))
                ? { ...i, quantity: Number(i.quantity) + addQty }
                : i
            )
          });
        } else {
          // Initial cart addition: initialize quantity to MOQ (or specified quantity if >= MOQ)
          const initialQty = quantity !== null ? Math.max(moq, parseInt(quantity, 10) || moq) : moq;
          set({ items: [...items, { product, quantity: initialQty }] });
        }
        return { success: true };
      },

      removeItem: (identifier) => {
        const idStr = String(identifier);
        set({
          items: get().items.filter(
            i => String(i.product.id) !== idStr &&
                 String(i.product.cart_item_id || '') !== idStr
          )
        });
      },

      updateQuantity: (identifier, quantity) => {
        const idStr = String(identifier);
        const numQty = parseInt(quantity, 10);
        if (isNaN(numQty) || numQty <= 0) {
          set({
            items: get().items.filter(
              i => String(i.product.id) !== idStr && String(i.product.cart_item_id || '') !== idStr
            )
          });
        } else {
          set({
            items: get().items.map(i =>
              (String(i.product.id) === idStr || String(i.product.cart_item_id || '') === idStr)
                ? { ...i, quantity: numQty }
                : i
            )
          });
        }
      },

      clearCart: () => set({ items: [] }),

      get totalItems() {
        return get().items.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
      },

      get totalAmount() {
        return get().items.reduce(
          (sum, i) => sum + (parseFloat(i.product.price || i.product.base_price || 0) * Number(i.quantity || 0)),
          0
        );
      }
    }),
    { name: 'vfabrica-cart' }
  )
);
