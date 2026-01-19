/**
 * Credit package definitions for purchase.
 * Centralized configuration for pricing consistency.
 */
export const CREDIT_PACKAGES = [
    { credits: 10000, amount: 9.90, label: "Starter" },
    { credits: 30000, amount: 24.90, label: "Pro" },
    { credits: 70000, amount: 49.90, label: "Expert" },
];

export type CreditPackage = typeof CREDIT_PACKAGES[number];


/**
 * Starting bonus credits for new users.
 * Controlled by IP-based rate limiting to prevent abuse.
 */
export const STARTING_BONUS_CREDITS = 2000;
