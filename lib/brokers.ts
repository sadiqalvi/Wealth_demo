/**
 * Partner brokers shown on the Sahulat KYC form (broker dropdown in consumer-demo-app).
 * Keep this list aligned when form options change (e.g. K-Trade, Alpha Capital).
 */
export const SAHULAT_BROKERS = [
  "AKD Securities",
  "Next Capital",
  "K-Trade",
  "Alpha Capital"
] as const;

export type SahulatBroker = (typeof SAHULAT_BROKERS)[number];
