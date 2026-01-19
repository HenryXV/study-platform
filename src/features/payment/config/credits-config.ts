/**
 * Credit package definitions for purchase.
 * Centralized configuration for pricing consistency.
 */
export const CREDIT_PACKAGES = [
    { credits: 1, amount: 0.20, label: "Starter" },
    { credits: 3, amount: 1.00, label: "Pro" },
    { credits: 60000, amount: 49.90, label: "Expert" },
];

export type CreditPackage = typeof CREDIT_PACKAGES[number];


/**
 * Starting bonus credits for new users.
 * Controlled by IP-based rate limiting to prevent abuse.
 */
export const STARTING_BONUS_CREDITS = 2000;
