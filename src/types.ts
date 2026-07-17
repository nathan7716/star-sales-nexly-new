export enum UserStage {
  UNREGISTERED = "未注册",
  REGISTERED_NO_KYC = "已注册未提交KYC",
  KYC_UNDER_REVIEW = "KYC审核中",
  KYC_PASSED_NO_DEPOSIT = "KYC已通过未入金",
  FTD_NO_TRADE = "已入金(FTD)未交易",
  FTT_NO_REDEPOSIT = "已交易(FTT)未复投",
  REDEPOSITED = "已复投(多次入金)",
  FTW_COMPLETED = "已完成FTW",
  CHURNED_SILENT = "流失/沉默"
}

export interface User {
  id: string;
  name: string;
  stage: UserStage;
  stayDays: number; // 阶段停留时间（天）
  lastActiveDays: number; // 沉默时间（天）
  region: string; // 国家/地区代码 (CN, SG, HK, UK, US, etc.)
  language: "zh" | "en";
  currency: string; // USD, CNY, etc.
  email: string;
  phone: string;
  deviceToken: string;
  riskPreference: "保守" | "平衡" | "激进" | "激進";
  capitalScale: "小额" | "中额" | "大额" | "小額" | "中額" | "大額";
  investmentExperience: "新手" | "有经验";
  churnRisk: boolean;
}

export type StrategyType = "资金激励类" | "内容教育类" | "限时/紧迫感类";

export interface CampaignCopies {
  email: { zh: string; en: string };
  sms: { zh: string; en: string };
  push: { zh: string; en: string };
  whatsapp: { zh: string; en: string };
}

export interface Campaign {
  id: string;
  segment: UserStage;
  name: string;
  strategyType: StrategyType;
  parameters: {
    bonusPct?: number; // Incentive percent, e.g. 10
    maxBonus?: number; // Max bonus amount, e.g. 100
    courseTitle?: string; // Course title for educational campaigns
    durationHours?: number; // Limit time duration, e.g. 72
    incentiveDetail?: string; // Custom strategy descriptions
  };
  detailsMarkdown: string; // AI generated strategy text
  channels: ("email" | "sms" | "push" | "whatsapp")[];
  copies: CampaignCopies;
  status: "draft" | "review" | "sending" | "active" | "completed";
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
  windowDays: number; // 3, 7, 14
  targetsCount: number;
  targetedUserIds: string[];
  touchMetrics: {
    email: { sent: number; opened: number };
    sms: { sent: number };
    push: { sent: number; opened: number };
    whatsapp: { sent: number };
  };
  convertedUserIds: string[];
  convertedCount: number;
  conversionRate: number; // percentage (0-100)
  optimizationStatus: "none" | "pending" | "approved" | "rejected";
  optimizationSuggestion?: {
    summary: string;
    rationale: string;
    proposedChange: string; // e.g. "提高入金 bonus 力度到 15%", "该阶段改用内容教育类方案"
  };
}

export interface AIAdjustment {
  id: string;
  stage: UserStage;
  proposedChange: string;
  rationale: string;
  approvedAt: string;
}

export interface AIRules {
  lastUpdate: string;
  adjustments: AIAdjustment[];
}
