import { apiClient } from "./apiClient";
import type {
  ApiResponse,
  Bank,
  CatalogueItem,
  CourierChargeResult,
  Customer,
  CustomerSip,
  CustomerSipStatus,
  Gift,
  GiftClaimResult,
  GiftPreview,
  GiftPurchaseResult,
  GiftTemplate,
  IncomingGift,
  Kyc,
  KycThresholdInfo,
  LookupMobileResult,
  MetalRate,
  MetalType,
  Portfolio,
  Purchase,
  PurchasePreview,
  Redemption,
  RedeemPreview,
  SellPreview,
  SipFrequency,
  SipInstallment,
  SipPlan,
  SipPreview,
} from "./types";

export async function getProfile(): Promise<Customer> {
  const res = await apiClient.get<ApiResponse<Customer>>("/api/customer/profile");
  return res.data.data;
}

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  address?: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<Customer> {
  const res = await apiClient.put<ApiResponse<Customer>>("/api/customer/profile", input);
  return res.data.data;
}

export async function getRates(): Promise<MetalRate> {
  const res = await apiClient.get<ApiResponse<MetalRate>>("/api/customer/rates");
  return res.data.data;
}

export interface PreviewInput {
  metalType: MetalType;
  amount?: number;
  weight?: number;
}

export async function previewPurchase(input: PreviewInput): Promise<PurchasePreview> {
  const res = await apiClient.post<ApiResponse<PurchasePreview>>("/api/customer/purchase/preview", input);
  return res.data.data;
}

export async function confirmPurchase(input: PreviewInput): Promise<Purchase> {
  const res = await apiClient.post<ApiResponse<Purchase>>("/api/customer/purchase", input);
  return res.data.data;
}

// ----- Online payment (CCAvenue) for BUY -----

export interface PaymentOrder {
  orderId: string;
  status: "INITIATED" | "SUCCESS" | "FAILED" | "ABORTED";
  metalType: MetalType;
  weight: number;
  amount: number;
  statusMessage: string | null;
  purchaseId: number | null;
}

export async function getPaymentConfig(): Promise<{ enabled: boolean }> {
  const res = await apiClient.get<ApiResponse<{ enabled: boolean }>>("/api/customer/payments/config");
  return res.data.data;
}

/** Starts an online BUY; open payUrl in a WebView. Metal is credited only when the gateway reports success. */
export async function initiateBuyPayment(
  input: PreviewInput
): Promise<PaymentOrder & { payUrl: string; returnUrlPrefix: string }> {
  const res = await apiClient.post<ApiResponse<PaymentOrder & { payUrl: string; returnUrlPrefix: string }>>(
    "/api/customer/payments/buy",
    input
  );
  return res.data.data;
}

export async function getPaymentStatus(orderId: string): Promise<PaymentOrder> {
  const res = await apiClient.get<ApiResponse<PaymentOrder>>(`/api/customer/payments/${encodeURIComponent(orderId)}`);
  return res.data.data;
}

export async function listPurchases(): Promise<Purchase[]> {
  const res = await apiClient.get<ApiResponse<Purchase[]>>("/api/customer/purchases");
  return res.data.data;
}

export async function getPortfolio(): Promise<Portfolio> {
  const res = await apiClient.get<ApiResponse<Portfolio>>("/api/customer/portfolio");
  return res.data.data;
}

export async function previewSell(input: PreviewInput): Promise<SellPreview> {
  const res = await apiClient.post<ApiResponse<SellPreview>>("/api/customer/sell/preview", input);
  return res.data.data;
}

export async function confirmSell(input: PreviewInput): Promise<Purchase> {
  const res = await apiClient.post<ApiResponse<Purchase>>("/api/customer/sell", input);
  return res.data.data;
}

export interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

export async function submitKyc(
  panHolderName: string,
  panNumber: string,
  image: PickedImage
): Promise<Kyc> {
  const formData = new FormData();
  formData.append("PanHolderName", panHolderName);
  formData.append("PanNumber", panNumber);
  formData.append("panImage", {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as unknown as Blob);

  const res = await apiClient.post<ApiResponse<Kyc>>("/api/customer/kyc", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

/** Returns null if the customer hasn't submitted KYC yet (backend returns 404). */
export async function getKyc(): Promise<Kyc | null> {
  try {
    const res = await apiClient.get<ApiResponse<Kyc>>("/api/customer/kyc");
    return res.data.data;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export interface BankInput {
  AccountHolderName: string;
  BankName: string;
  AccountNumber: string;
  IFSC: string;
}

export async function submitBank(input: BankInput): Promise<Bank> {
  const res = await apiClient.post<ApiResponse<Bank>>("/api/customer/bank", input);
  return res.data.data;
}

/** Threshold-aware KYC status — KYC is optional until cumulative value crosses the threshold. */
export async function getKycStatus(): Promise<KycThresholdInfo> {
  const res = await apiClient.get<ApiResponse<KycThresholdInfo>>("/api/customer/kyc-status");
  return res.data.data;
}

/** Returns null if the customer hasn't submitted bank details yet (backend returns 404). */
export async function getBank(): Promise<Bank | null> {
  try {
    const res = await apiClient.get<ApiResponse<Bank>>("/api/customer/bank");
    return res.data.data;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

// ----- SIP -----

export async function listSipPlans(): Promise<SipPlan[]> {
  const res = await apiClient.get<ApiResponse<SipPlan[]>>("/api/customer/sip-plans");
  return res.data.data;
}

export interface SipPreviewInput {
  sipPlanId: number;
  amount: number;
}

export async function previewSip(input: SipPreviewInput): Promise<SipPreview> {
  const res = await apiClient.post<ApiResponse<SipPreview>>("/api/customer/sip/preview", input);
  return res.data.data;
}

export interface SubscribeSipInput {
  sipPlanId: number;
  amount: number;
  frequency?: SipFrequency;
  dueDay?: number;
  dueWeekday?: number;
}

export async function subscribeSip(input: SubscribeSipInput): Promise<CustomerSip> {
  const res = await apiClient.post<ApiResponse<CustomerSip>>("/api/customer/sip", input);
  return res.data.data;
}

export async function listMySips(): Promise<CustomerSip[]> {
  const res = await apiClient.get<ApiResponse<CustomerSip[]>>("/api/customer/sips");
  return res.data.data;
}

export interface UpdateSipInput {
  status?: CustomerSipStatus;
  amount?: number;
}

export async function updateSip(id: number, input: UpdateSipInput): Promise<CustomerSip> {
  const res = await apiClient.put<ApiResponse<CustomerSip>>(`/api/customer/sip/${id}`, input);
  return res.data.data;
}

export async function listSipInstallments(id: number): Promise<SipInstallment[]> {
  const res = await apiClient.get<ApiResponse<SipInstallment[]>>(`/api/customer/sip/${id}/installments`);
  return res.data.data;
}

// ----- Catalogue -----

/** Newest first, per the backend's ordering. */
export async function getCatalogue(): Promise<CatalogueItem[]> {
  const res = await apiClient.get<ApiResponse<CatalogueItem[]>>("/api/customer/catalogue");
  return res.data.data;
}

// ----- Gold Lifafa (Gifts) -----

/** UPI-style payee-name lookup — scoped server-side to the caller's own dealer. */
export async function lookupMobile(mobile: string): Promise<LookupMobileResult> {
  const res = await apiClient.get<ApiResponse<LookupMobileResult>>("/api/customer/lookup-mobile", { params: { mobile } });
  return res.data.data;
}

/** Only ACTIVE templates, per the backend's filter. */
export async function getGiftTemplates(): Promise<GiftTemplate[]> {
  const res = await apiClient.get<ApiResponse<GiftTemplate[]>>("/api/customer/gift-templates");
  return res.data.data;
}

export interface BuyGiftInput {
  giftTemplateId: number;
  recipientMobile: string;
  message?: string;
}

export async function buyGift(input: BuyGiftInput): Promise<GiftPurchaseResult> {
  const res = await apiClient.post<ApiResponse<GiftPurchaseResult>>("/api/customer/gifts/buy", input);
  return res.data.data;
}

export async function listGifts(): Promise<Gift[]> {
  const res = await apiClient.get<ApiResponse<Gift[]>>("/api/customer/gifts");
  return res.data.data;
}

/** The in-app notification feed — UNCLAIMED gifts assigned to the caller's own mobile number. */
export async function listIncomingGifts(): Promise<IncomingGift[]> {
  const res = await apiClient.get<ApiResponse<IncomingGift[]>>("/api/customer/gifts/incoming");
  return res.data.data;
}

/** Clears the notification badge for one gift; only the assigned recipient can call this. */
export async function markGiftSeen(giftId: number): Promise<{ id: number; seen: boolean }> {
  const res = await apiClient.post<ApiResponse<{ id: number; seen: boolean }>>("/api/customer/gifts/mark-seen", { giftId });
  return res.data.data;
}

/** Preview-only — safe to call before claiming, does not mutate gift state. */
export async function getGiftPreview(code: string): Promise<GiftPreview> {
  const res = await apiClient.get<ApiResponse<GiftPreview>>(`/api/customer/gifts/code/${encodeURIComponent(code)}`);
  return res.data.data;
}

/** Same preview as by-code, but for the notification-feed path where the gift is already known by id. */
export async function getGiftPreviewById(giftId: number): Promise<GiftPreview> {
  const res = await apiClient.get<ApiResponse<GiftPreview>>(`/api/customer/gifts/${giftId}/preview`);
  return res.data.data;
}

export interface ClaimGiftInput {
  code?: string;
  giftId?: number;
}

export async function claimGift(input: ClaimGiftInput): Promise<GiftClaimResult> {
  const res = await apiClient.post<ApiResponse<GiftClaimResult>>("/api/customer/gifts/claim", input);
  return res.data.data;
}

export async function cancelGift(id: number): Promise<void> {
  await apiClient.post(`/api/customer/gifts/${id}/cancel`);
}

// ----- Redeem (physical metal delivery by courier) -----

/** The courier charge that would apply for a given metal/grams, so the app can show it before confirming. */
export async function getCourierCharge(metalType: MetalType, grams: number): Promise<CourierChargeResult> {
  const res = await apiClient.get<ApiResponse<CourierChargeResult>>("/api/customer/courier-charge", {
    params: { metalType, grams },
  });
  return res.data.data;
}

export interface RedeemPreviewInput {
  metalType: MetalType;
  grams?: number;
  amount?: number;
}

export async function previewRedeem(input: RedeemPreviewInput): Promise<RedeemPreview> {
  const res = await apiClient.post<ApiResponse<RedeemPreview>>("/api/customer/redeem/preview", input);
  return res.data.data;
}

export interface RedeemAddressInput {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface RedeemInput {
  metalType: MetalType;
  grams: number;
  address: RedeemAddressInput;
}

export async function confirmRedeem(input: RedeemInput): Promise<Redemption> {
  const res = await apiClient.post<ApiResponse<Redemption>>("/api/customer/redeem", input);
  return res.data.data;
}

export async function listRedemptions(): Promise<Redemption[]> {
  const res = await apiClient.get<ApiResponse<Redemption[]>>("/api/customer/redemptions");
  return res.data.data;
}

export async function getRedemption(id: number): Promise<Redemption> {
  const res = await apiClient.get<ApiResponse<Redemption>>(`/api/customer/redemptions/${id}`);
  return res.data.data;
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}
