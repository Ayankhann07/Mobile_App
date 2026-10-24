export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Customer {
  CustomerID: number;
  DealerID: number;
  FullName: string;
  MobileNumber: string;
  Email: string | null;
  Address: string | null;
  CreatedAt: string;
}

export interface AuthResponse {
  token: string;
  customer: Customer;
}

export interface MetalRate {
  id: number;
  DealerID: number;
  GoldRatePerGram: string;
  SilverRatePerGram: string;
  GoldSellRatePerGram: string;
  SilverSellRatePerGram: string;
  UpdatedAt: string;
}

export type MetalType = "GOLD" | "SILVER";

export type TxnType = "BUY" | "SELL" | "GIFT_SENT" | "GIFT_RECEIVED" | "REDEEM";

export interface PurchasePreview {
  metalType: MetalType;
  rate: number;
  amount: number;
  cgst: number;
  sgst: number;
  totalTaxPercent: number;
  totalTax: number;
  netInvestment: number;
  metalQuantity: number;
}

/** Sell transactions are not taxed, so the preview is a plain rate × weight calc. */
export interface SellPreview {
  metalType: MetalType;
  rate: number;
  weight: number;
  amount: number;
}

export interface Purchase {
  id: number;
  DealerID: number;
  CustomerID: number;
  MetalType: MetalType;
  Type: TxnType;
  Rate: string;
  Weight: string;
  Amount: string;
  CGST: string;
  SGST: string;
  NetAmount: string;
  Status: string;
  CreatedAt: string;
  /** Set only on GIFT_SENT/GIFT_RECEIVED rows — the other party's name, once known. */
  giftCounterpartyName?: string | null;
  /** Set only on GIFT_SENT/GIFT_RECEIVED rows — whether the underlying gift has been claimed. */
  giftClaimed?: boolean | null;
}

export interface Portfolio {
  goldGrams: number;
  goldRate: number;
  goldValue: number;
  goldSellRate: number;
  silverGrams: number;
  silverRate: number;
  silverValue: number;
  silverSellRate: number;
  totalValue: number;
}

export type KycStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Kyc {
  id: number;
  CustomerID: number;
  DealerID: number;
  PanHolderName: string;
  PanNumber: string;
  PanImagePath: string;
  Status: KycStatus;
  CreatedAt: string;
}

export interface Bank {
  id: number;
  CustomerID: number;
  DealerID: number;
  AccountHolderName: string;
  BankName: string;
  AccountNumber: string;
  IFSC: string;
}

// ----- SIP -----

export type SipPlanStatus = "ACTIVE" | "INACTIVE";

export type CustomerSipStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

export type SipFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface SipPlan {
  id: number;
  MetalType: MetalType;
  MinAmount: string;
  MaxAmount: string;
  ApplyGst: boolean;
  Frequency: SipFrequency;
  Status: SipPlanStatus;
  CreatedAt: string;
}

export interface SipPlanSummary {
  MetalType: MetalType;
  MinAmount: string;
  MaxAmount: string;
  ApplyGst: boolean;
  Frequency: SipFrequency;
  Status: SipPlanStatus;
}

export interface CustomerSip {
  id: number;
  MetalType: MetalType;
  Amount: string;
  Frequency: SipFrequency;
  DueDay: number | null;
  DueWeekday: number | null;
  Status: CustomerSipStatus;
  NextRunDate: string;
  LastRunDate: string | null;
  sipPlan: SipPlanSummary;
}

export interface SipInstallmentPurchase {
  MetalType: MetalType;
  Rate: string;
  Weight: string;
  Amount: string;
  NetAmount: string;
  CreatedAt: string;
}

export interface SipInstallment {
  id: number;
  Amount: string;
  Rate: string;
  Weight: string;
  RunDate: string;
  purchase: SipInstallmentPurchase;
}

/** Live GST/metal breakdown for a candidate SIP amount, computed the same way an actual auto-invest run would be. */
export interface SipPreview {
  metalType: MetalType;
  rate: number;
  amount: number;
  applyGst: boolean;
  cgst: number;
  sgst: number;
  totalTax: number;
  netInvestment: number;
  metalQuantity: number;
}

// ----- Catalogue -----

export interface CatalogueItem {
  id: number;
  ImagePath: string;
  Title: string | null;
  Description: string | null;
  CreatedAt: string;
}

// ----- Gold Lifafa (Gifts) -----

export type GiftTemplateStatus = "ACTIVE" | "INACTIVE";
export type GiftStatus = "UNCLAIMED" | "CLAIMED" | "CANCELLED";
export type GiftDirection = "SENT" | "RECEIVED";

export interface GiftTemplate {
  id: number;
  MetalType: MetalType;
  Amount: string;
  Title: string | null;
  Description: string | null;
  ImagePath: string | null;
  Status: GiftTemplateStatus;
}

export interface GiftPerson {
  CustomerID: number;
  FullName: string;
  MobileNumber: string;
}

export interface GiftTemplateSummary {
  id: number;
  Title: string | null;
  Description: string | null;
  ImagePath: string | null;
}

/** Result of buying a gift — the sender's copy of the freshly-created envelope. */
export interface GiftPurchaseResult {
  id: number;
  code: string;
  shareLink: string;
  /** Ready-to-send invite text, e.g. "<Sender> sent you <gift> on <Dealer> 🎁 — login/sign up to open it: <link>". */
  shareMessage: string;
  metalType: MetalType;
  amount: number;
  grams: number;
  rateAtPurchase: number;
  message: string | null;
  status: "UNCLAIMED";
  recipientMobile: string;
  /** Null if that mobile number isn't a registered customer yet. */
  recipientName: string | null;
  createdAt: string;
}

/** One entry in the in-app notification feed — an UNCLAIMED gift assigned to the caller's own mobile number. */
export interface IncomingGift {
  id: number;
  code: string;
  senderName: string;
  title: string | null;
  metalType: MetalType;
  amount: number;
  grams: number;
  message: string | null;
  createdAt: string;
  /** Whether the recipient has viewed this in the notification feed yet (independent of claim status). */
  seen: boolean;
}

export type LookupMobileResult = { exists: true; fullName: string; customerId: number } | { exists: false };

export interface Gift {
  id: number;
  direction: GiftDirection;
  code: string;
  shareLink: string;
  metalType: MetalType;
  amount: number;
  grams: number;
  status: GiftStatus;
  message: string | null;
  template: GiftTemplateSummary;
  sender: GiftPerson;
  receiver: GiftPerson | null;
  /** The mobile number this gift was assigned to at send time (SENT items only; null on old link-only gifts). */
  recipientMobile: string | null;
  /** Name matching recipientMobile, if that number belongs to a known customer. */
  recipientName: string | null;
  createdAt: string;
  claimedAt: string | null;
}

/** Preview-by-code — safe to fetch before claiming, never mutates gift state. */
export interface GiftPreview {
  senderName: string;
  metalType: MetalType;
  amount: number;
  grams: number;
  message: string | null;
  status: GiftStatus;
  alreadyClaimed: boolean;
  isOwnGift: boolean;
}

export interface GiftClaimResult {
  id: number;
  code: string;
  senderName: string | null;
  metalType: MetalType;
  amount: number;
  grams: number;
  status: "CLAIMED";
  claimedAt: string;
}

// ----- Redemptions (physical metal delivery by courier) -----

export type RedemptionStatus = "REQUESTED" | "APPROVED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface RedeemAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
}

/** GET /api/customer/courier-charge — the charge that would apply for a given metal/grams. */
export interface CourierChargeResult {
  mode: "FLAT" | "SLAB";
  charge: number;
}

/** POST /api/customer/redeem/preview — no DB write. */
export interface RedeemPreview {
  metalType: MetalType;
  grams: number;
  currentSellRate: number;
  approxValue: number;
  courierCharge: number;
  holdingsAfter: number;
}

/** A physical-delivery redemption order (POST /api/customer/redeem and the redemptions list/detail endpoints). */
export interface Redemption {
  id: number;
  metalType: MetalType;
  grams: number;
  rateAtRequest: number;
  courierCharge: number;
  /** Always present — explains the charge is collected offline (no payment gateway). */
  courierChargeNote: string;
  address: RedeemAddress;
  status: RedemptionStatus;
  trackingNumber: string | null;
  courierName: string | null;
  purchaseId: number | null;
  createdAt: string;
  updatedAt: string;
}

// ----- KYC threshold -----

export type KycThresholdStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface KycThresholdInfo {
  kycStatus: KycThresholdStatus;
  cumulativeTransactionValue: number;
  holdingsValue: number;
  threshold: number;
  kycRequired: boolean;
  remainingBeforeKyc: number;
}
