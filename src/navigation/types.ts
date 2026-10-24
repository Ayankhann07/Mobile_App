import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { Purchase, MetalType, GiftTemplate, Redemption } from "../services/types";

export type AuthStackParamList = {
  Login: undefined;
  Register: { mobileNumber: string };
  Otp: { mode: "login" | "register"; mobileNumber: string; fullName?: string };
};

export type ProfileTabKey = "profile" | "kyc" | "bank";

export type MainTabParamList = {
  Home: undefined;
  Invest: undefined;
  SIP: undefined;
  History: undefined;
  ProfileTab: { initialTab?: ProfileTabKey } | undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  BuyMetal: { metalType: MetalType };
  SellMetal: { metalType: MetalType };
  RedeemMetal: { metalType: MetalType };
  PurchaseConfirmation: { purchase: Purchase };
  Payment: { payUrl: string; returnUrlPrefix: string; orderId: string };
  RedeemConfirmation: { redemption: Redemption };
  MyRedemptions: undefined;
  RedemptionDetail: { redemption: Redemption };
  StartSip: undefined;
  SipInstallments: { sipId: number; metalType: MetalType };
  Catalogue: undefined;
  GiftStore: undefined;
  BuyGift: { template: GiftTemplate };
  MyGifts: undefined;
  Notifications: undefined;
  OpenGift: { code?: string; giftId?: number } | undefined;
};

export type AppDrawerParamList = {
  AppStack: NavigatorScreenParams<AppStackParamList> | undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<AppStackParamList, T>;
