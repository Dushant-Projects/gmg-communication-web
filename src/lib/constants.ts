export const STORE_NAME = "GMG Store";
export const SHIPPING_FEE = 500; // keep in sync with v_shipping in place_order() (SQL)
export const MAX_QTY = 10;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/brands", label: "Brands" },
  { href: "/shop?deals=1", label: "Deals" },
  { href: "/shop?group=accessories", label: "Accessories" },
];

// TODO: replace with the client's real details. Empty social links are hidden.
export const CONTACT = { email: "support@yourstore.example", phone: "+92 300 0000000", address: "Pakistan" };
export const SOCIAL = [
  { label: "Facebook", href: "" },
  { label: "Instagram", href: "" },
  { label: "WhatsApp", href: "" },
];

export const COUPON_MESSAGES: Record<string, string> = {
  INVALID_COUPON: "That coupon code isn't valid.",
  COUPON_NOT_STARTED: "This coupon isn't active yet.",
  COUPON_EXPIRED: "This coupon has expired.",
  COUPON_LIMIT_REACHED: "This coupon has reached its usage limit.",
  COUPON_MIN_ORDER: "Your order doesn't meet the minimum amount for this coupon.",
  COUPON_ALREADY_USED: "You've already used this coupon.",
};

export const ORDER_ERRORS: Record<string, string> = {
  AUTH_REQUIRED: "Please log in to place your order.",
  EMPTY_CART: "Your cart is empty.",
  INVALID_QUANTITY: "One of the quantities is invalid. Please review your cart.",
  INVALID_ADDRESS: "Please fill in your name, phone number and delivery address.",
  INVALID_PAYMENT_METHOD: "Please choose a valid payment method.",
  PRODUCT_UNAVAILABLE: "One of the items is no longer available. Please review your cart.",
  VARIANT_REQUIRED: "Please choose product options (color, storage) for every item.",
  OUT_OF_STOCK: "One of your items just went out of stock or has fewer units than selected. Please review your cart.",
  ...COUPON_MESSAGES,
};

export function friendlyOrderError(message?: string | null) {
  const key = Object.keys(ORDER_ERRORS).find((k) => message?.includes(k));
  return key ? ORDER_ERRORS[key] : "We couldn't place your order. Please try again.";
}

export const PROOF_ERRORS: Record<string, string> = {
  AUTH_REQUIRED: "Please log in again.",
  PROOF_REQUIRED: "Upload a screenshot or enter your transaction reference.",
  ORDER_NOT_FOUND: "We couldn't find this order.",
  NO_PROOF_NEEDED: "This order doesn't need a payment proof.",
};

export function friendlyProofError(message?: string | null) {
  const key = Object.keys(PROOF_ERRORS).find((k) => message?.includes(k));
  return key ? PROOF_ERRORS[key] : "We couldn't submit that. Please try again.";
}
