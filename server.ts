import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { UserStage, User, Campaign, AIRules, StrategyType, CampaignCopies } from "./src/types.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

app.use(express.json());

// Initialize Database
const seedUsers: User[] = [
  { id: "u-101", name: "張偉 (Zhang Wei)", stage: UserStage.UNREGISTERED, stayDays: 1, lastActiveDays: 0, region: "CN", language: "zh", currency: "CNY", email: "zhangwei@example.com", phone: "+86 13800138000", deviceToken: "token_zw", riskPreference: "平衡", capitalScale: "中額", investmentExperience: "新手", churnRisk: false },
  { id: "u-102", name: "David Miller", stage: UserStage.REGISTERED_NO_KYC, stayDays: 5, lastActiveDays: 2, region: "US", language: "en", currency: "USD", email: "david.m@example.com", phone: "+1 555-0192", deviceToken: "token_dm", riskPreference: "激进", capitalScale: "大额", investmentExperience: "有经验", churnRisk: false },
  { id: "u-103", name: "李娜 (Li Na)", stage: UserStage.REGISTERED_NO_KYC, stayDays: 8, lastActiveDays: 1, region: "CN", language: "zh", currency: "CNY", email: "lina@example.com", phone: "+86 13911112222", deviceToken: "token_ln", riskPreference: "保守", capitalScale: "小额", investmentExperience: "新手", churnRisk: false },
  { id: "u-104", name: "陳俊傑 (Chen Junjie)", stage: UserStage.KYC_UNDER_REVIEW, stayDays: 2, lastActiveDays: 0, region: "HK", language: "zh", currency: "HKD", email: "junjie.c@example.com", phone: "+852 91234567", deviceToken: "token_cjj", riskPreference: "平衡", capitalScale: "中額", investmentExperience: "新手", churnRisk: false },
  { id: "u-105", name: "Sarah Connor", stage: UserStage.KYC_PASSED_NO_DEPOSIT, stayDays: 4, lastActiveDays: 1, region: "GB", language: "en", currency: "GBP", email: "sconnor@example.com", phone: "+44 7700 900077", deviceToken: "token_sc", riskPreference: "激进", capitalScale: "中额", investmentExperience: "有经验", churnRisk: false },
  { id: "u-106", name: "王超 (Wang Chao)", stage: UserStage.KYC_PASSED_NO_DEPOSIT, stayDays: 9, lastActiveDays: 3, region: "CN", language: "zh", currency: "CNY", email: "wangchao@example.com", phone: "+86 18600001234", deviceToken: "token_wc", riskPreference: "平衡", capitalScale: "大额", investmentExperience: "新手", churnRisk: false },
  { id: "u-107", name: "Sophia Wong", stage: UserStage.KYC_PASSED_NO_DEPOSIT, stayDays: 12, lastActiveDays: 5, region: "SG", language: "en", currency: "SGD", email: "sophia.w@example.com", phone: "+65 8123 4567", deviceToken: "token_sw", riskPreference: "保守", capitalScale: "小额", investmentExperience: "新手", churnRisk: false },
  { id: "u-108", name: "Alex Johnson", stage: UserStage.FTD_NO_TRADE, stayDays: 3, lastActiveDays: 0, region: "US", language: "en", currency: "USD", email: "alex.j@example.com", phone: "+1 555-0143", deviceToken: "token_aj", riskPreference: "激进", capitalScale: "中额", investmentExperience: "有经验", churnRisk: false },
  { id: "u-109", name: "劉洋 (Liu Yang)", stage: UserStage.FTD_NO_TRADE, stayDays: 8, lastActiveDays: 2, region: "CN", language: "zh", currency: "CNY", email: "liuyang@example.com", phone: "+86 13522223333", deviceToken: "token_ly", riskPreference: "平衡", capitalScale: "小额", investmentExperience: "新手", churnRisk: false },
  { id: "u-110", name: "Michael Chang", stage: UserStage.FTT_NO_REDEPOSIT, stayDays: 4, lastActiveDays: 1, region: "HK", language: "zh", currency: "HKD", email: "mchang@example.com", phone: "+852 98765432", deviceToken: "token_mc", riskPreference: "激进", capitalScale: "大额", investmentExperience: "有经验", churnRisk: false },
  { id: "u-111", name: "Emily Watson", stage: UserStage.FTT_NO_REDEPOSIT, stayDays: 15, lastActiveDays: 6, region: "GB", language: "en", currency: "GBP", email: "emily.w@example.com", phone: "+44 7700 900111", deviceToken: "token_ew", riskPreference: "平衡", capitalScale: "中额", investmentExperience: "新手", churnRisk: false },
  { id: "u-112", name: "周浩 (Zhou Hao)", stage: UserStage.REDEPOSITED, stayDays: 20, lastActiveDays: 1, region: "CN", language: "zh", currency: "CNY", email: "zhouhao@example.com", phone: "+86 18900009999", deviceToken: "token_zh", riskPreference: "平衡", capitalScale: "大额", investmentExperience: "有经验", churnRisk: false },
  { id: "u-113", name: "Emma Smith", stage: UserStage.FTW_COMPLETED, stayDays: 10, lastActiveDays: 12, region: "US", language: "en", currency: "USD", email: "emma.smith@example.com", phone: "+1 555-0155", deviceToken: "token_es", riskPreference: "保守", capitalScale: "中额", investmentExperience: "有经验", churnRisk: true },
  { id: "u-114", name: "陳志強 (Chen Zhiqiang)", stage: UserStage.CHURNED_SILENT, stayDays: 45, lastActiveDays: 30, region: "HK", language: "zh", currency: "HKD", email: "zqchen@example.com", phone: "+852 61234567", deviceToken: "token_czq", riskPreference: "保守", capitalScale: "大額", investmentExperience: "有经验", churnRisk: true },
  { id: "u-115", name: "John Doe", stage: UserStage.REGISTERED_NO_KYC, stayDays: 15, lastActiveDays: 14, region: "US", language: "en", currency: "USD", email: "johndoe@example.com", phone: "+1 555-0111", deviceToken: "token_jd", riskPreference: "平衡", capitalScale: "小额", investmentExperience: "新手", churnRisk: false }
];

const seedCampaigns: Campaign[] = [
  {
    id: "c-001",
    segment: UserStage.KYC_PASSED_NO_DEPOSIT,
    name: "KYC首充迎新10%贈金加成",
    strategyType: "资金激励类",
    parameters: { bonusPct: 10, maxBonus: 50, durationHours: 72 },
    detailsMarkdown: "### KYC已通過未入金激活策略\n\n面向已完成KYC但尚未完成首次充值(FTD)的用戶。通過提供10%充值贈金加成（最高$50），製造時間緊迫感，促使用戶在72小時內完成首次入金。此策略旨在轉化猶豫不決的註冊用戶。",
    channels: ["email", "sms", "push"],
    copies: {
      email: {
        zh: "【限時福利】您的 10% 充值贈金已到賬，首充即刻解鎖！\n\n尊敬的用戶，恭喜您已通過 KYC 認證。現在充值即可享受 10% 的限時赠金加成，最高可得 50 USDT！快點擊下方鏈接，開啟您的加密之旅吧。\n\n▶ 首充傳送門：[點擊入金]\n\n歡迎加入我們的官方 Telegram 頻道：https://t.me/CryptoExchangeCN 和 WhatsApp 交流群：https://chat.whatsapp.com/CNGroup 獲取第一手市場分析！",
        en: "[Limited Offer] Your 10% Deposit Bonus is active, deposit now to unlock!\n\nDear User, Congratulations on passing KYC verification! Deposit now and get a 10% bonus boost up to 50 USDT! Click the link below to start your crypto investment.\n\n▶ Deposit Now: [Deposit Link]\n\nJoin our Telegram Channel: https://t.me/CryptoExchangeEN and WhatsApp Community: https://chat.whatsapp.com/ENGroup for hot trading signals!"
      },
      sms: {
        zh: "【Crypto】首充福利：您已通過KYC，72小時內首次入金享10%贈金，最高送50U！點擊 https://example.com/d 立即參與。退訂回T",
        en: "[Crypto] Exclusive: Passed KYC! Deposit within 72h to get a 10% bonus boost up to 50 USDT. Start at https://example.com/d opt-out reply STOP"
      },
      push: {
        zh: "🔥 通過KYC特惠：首充立享10%赠金加成！最高送50 USDT，限時72小時，點擊入金！",
        en: "🔥 KYC Passed Special: Get 10% bonus on your first deposit! Up to 50 USDT. Valid for 72h only. Tap to earn!"
      },
      whatsapp: {
        zh: "📢 恭喜您通過認證！現在完成首次充值即可獲得 10% 限時迎新加成（最高50 USDT）！活動僅限3天，專屬通道：https://example.com/d",
        en: "📢 Congrats on passing verification! Deposit now to secure your 10% exclusive welcome bonus (up to 50 USDT)! Valid for 3 days. Dedicated entry: https://example.com/d"
      }
    },
    status: "completed",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    windowDays: 7,
    targetsCount: 3,
    targetedUserIds: ["u-105", "u-106", "u-107"],
    touchMetrics: {
      email: { sent: 3, opened: 2 },
      sms: { sent: 3 },
      push: { sent: 3, opened: 1 },
      whatsapp: { sent: 0 }
    },
    convertedUserIds: ["u-105"], // Sophia Connor converted
    convertedCount: 1,
    conversionRate: 33.3,
    optimizationStatus: "pending",
    optimizationSuggestion: {
      summary: "充值迎新贈金轉化低於預期，建議調整激勵力度或改用教育方案",
      rationale: "本次活動在【KYC已通過未入金】階段僅取得33.3%的轉化率。數據顯示，大額與中額風險偏好的用戶對 10% 的激勵反應平淡。另外，保守型用戶更關注如何操作和資金安全。",
      proposedChange: "將充值贈金加成從 10% 提高至 15%，或者針對新用戶推送內容教育類活動，如【交易大師新手法寶課程】"
    }
  }
];

const seedRules: AIRules = {
  lastUpdate: new Date().toISOString(),
  adjustments: [
    {
      id: "adj-1",
      stage: UserStage.FTD_NO_TRADE,
      proposedChange: "該階段改用【內容教育類】方案替代【資金激勵類】",
      rationale: "歷史數據顯示，已入金未交易用戶多數面臨認知/技能壁壘（害怕虧損或不會下單），贈金對其觸發效果較差，而『交易大師視頻課程』等教程能顯著降低決策難度。",
      approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

interface DB {
  users: User[];
  campaigns: Campaign[];
  rules: AIRules;
}

function getDB(): DB {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const defaultDB: DB = {
      users: JSON.parse(JSON.stringify(seedUsers)),
      campaigns: JSON.parse(JSON.stringify(seedCampaigns)),
      rules: JSON.parse(JSON.stringify(seedRules))
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2), "utf8");
    return defaultDB;
  }

  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to parse DB, resetting to seed...", err);
    const defaultDB: DB = {
      users: JSON.parse(JSON.stringify(seedUsers)),
      campaigns: JSON.parse(JSON.stringify(seedCampaigns)),
      rules: JSON.parse(JSON.stringify(seedRules))
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2), "utf8");
    return defaultDB;
  }
}

function saveDB(db: DB) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

// Lazy load Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or placeholder. Falling back to rule-based fallback generation.");
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    return aiClient;
  } catch (e) {
    console.error("Error creating GoogleGenAI client:", e);
    return null;
  }
}

// Fallback Rule-Based Strategy Generator if Gemini API key is missing
function generateFallbackCampaign(segment: UserStage, rules: AIRules): Omit<Campaign, "id" | "status" | "createdAt" | "targetsCount" | "targetedUserIds" | "touchMetrics" | "convertedUserIds" | "convertedCount" | "conversionRate" | "optimizationStatus"> {
  // Determine if there is any approved adjustment rule for this stage
  const stageAdjustments = rules.adjustments.filter(a => a.stage === segment);
  const preferredType: StrategyType = stageAdjustments.some(a => a.proposedChange.includes("內容教育")) ? "内容教育类" : "资金激励类";

  let name = "";
  let strategyType: StrategyType = "资金激励类";
  let parameters: Campaign["parameters"] = {};
  let detailsMarkdown = "";
  let windowDays = 7;

  if (segment === UserStage.UNREGISTERED) {
    strategyType = "限时/紧迫感类";
    name = "新客限時註冊翻倍迎新禮包";
    parameters = { durationHours: 24, bonusPct: 50 };
    windowDays = 3;
    detailsMarkdown = `### 未註冊激活策略 - 限時註冊迎新禮包\n\n對未註冊用戶提供強烈的限時刺激，註冊即享充值金翻倍等新人權益（限時24小時）。製造強力緊迫感，消除猶豫情緒。`;
  } else if (segment === UserStage.REGISTERED_NO_KYC) {
    strategyType = "资金激励类";
    name = "限時通過KYC送交易手續費券";
    parameters = { durationHours: 72, bonusPct: 20 };
    windowDays = 3;
    detailsMarkdown = `### 已註冊未提交KYC策略\n\n針對已經註冊但卡在KYC階段的用戶。提供限時72小時內完成驗證即送抵用券的福利。大幅提高KYC通過率。`;
  } else if (segment === UserStage.KYC_PASSED_NO_DEPOSIT) {
    const hasIncentiveRule = stageAdjustments.some(a => a.proposedChange.includes("提高") && a.proposedChange.includes("bonus"));
    const pct = hasIncentiveRule ? 15 : 10;
    strategyType = "资金激励类";
    name = `首充尊享 ${pct}% 迎新加成活動`;
    parameters = { bonusPct: pct, maxBonus: 100, durationHours: 72 };
    windowDays = 7;
    detailsMarkdown = `### KYC已通過未入金策略\n\n根據優化建議，我們提供 ${pct}% 的首次充值加成，最高獎勵可達 100 USDT。這對新用戶入金具有強大的吸引力，縮短激活轉化周期。`;
  } else if (segment === UserStage.FTD_NO_TRADE) {
    // There is an approved adjustment rule: change to content education!
    strategyType = "内容教育类";
    name = "新入金用戶『零基礎交易大師視頻課程』";
    parameters = { courseTitle: "從零到一：首單合約跟單與網格交易大師班" };
    windowDays = 14;
    detailsMarkdown = `### 已入金未交易激活策略\n\n**【AI 閉環優化生效】** 該階段已根據歷史建議切換至【內容教育類】方案。解決用戶入金後“不敢交易、不懂策略、害怕虧損”的卡點。贈送原價$199的合約跟單視頻課程，降低其首單操作難度。`;
  } else if (segment === UserStage.FTT_NO_REDEPOSIT) {
    strategyType = "资金激励类";
    name = "老客復投加成：充值返手續費加倍";
    parameters = { bonusPct: 5, maxBonus: 200 };
    windowDays = 7;
    detailsMarkdown = `### 已交易未復投策略\n\n促使首次交易完成的用戶進行多次充值/復投。提供二次入金 5% 返佣或交易手續費返還加成。增加忠誠度。`;
  } else {
    strategyType = "资金激励类";
    name = "VIP復投交易多重充值禮遇";
    parameters = { bonusPct: 8 };
    windowDays = 7;
    detailsMarkdown = `### 交易所核心用戶持續激活策略\n\n面向高潛力/復投用戶，提供VIP多重入金驚喜禮包。持續拉升資產留存(AUM)與長期交易額度。`;
  }

  // Construct Channel Copies with brief TG/WhatsApp channels
  const copies: CampaignCopies = {
    email: {
      zh: `🔔 【活動通知】${name}\n\n親愛的用戶，您的專屬福利已到賬！${name}現已全面開啟。\n\n活動類型：${strategyType}\n` + 
          (parameters.bonusPct ? `加成比例：${parameters.bonusPct}%\n` : "") + 
          (parameters.maxBonus ? `最高贈金：${parameters.maxBonus} USDT\n` : "") +
          (parameters.courseTitle ? `贈送課程：《${parameters.courseTitle}》\n` : "") +
          (parameters.durationHours ? `有效期限：限時 ${parameters.durationHours} 小時內\n` : "") +
          `\n點擊下方專屬鏈接立享您的迎新禮遇！\n▶ 立即行動：[點擊跳轉參與]\n\n🔊 關注官方頻道不迷路：\n加入 Telegram 官方交流群：https://t.me/CryptoExchangeCN\n加入 WhatsApp 新手群：https://chat.whatsapp.com/CNGroup`,
      en: `🔔 [Exclusive Offer] ${name}\n\nDear User, Your tailored campaign is now active! Enjoy ${name} immediately.\n\nType: ${strategyType}\n` +
          (parameters.bonusPct ? `Bonus Ratio: ${parameters.bonusPct}%\n` : "") +
          (parameters.maxBonus ? `Max Value: ${parameters.maxBonus} USDT\n` : "") +
          (parameters.courseTitle ? `Premium Course: "${parameters.courseTitle}"\n` : "") +
          (parameters.durationHours ? `Valid Period: ${parameters.durationHours} Hours Only\n` : "") +
          `\nClick the portal below to claim your rewards now!\n▶ Claim Here: [Claim My Offer]\n\n🔊 Stay Connected:\nJoin our Telegram Channel: https://t.me/CryptoExchangeEN\nJoin our WhatsApp Community: https://chat.whatsapp.com/ENGroup`
    },
    sms: {
      zh: `【Crypto】${name}已開啟！${strategyType}重磅福利，限時立享。點擊 https://example.com/c 參與。退訂回T`,
      en: `[Crypto] ${name} is live! Exclusive ${strategyType} benefits are waiting. Tap https://example.com/c to claim. STOP to opt-out`
    },
    push: {
      zh: `⚡️ ${name}隆重推出！點擊領取您的專屬 ${strategyType} 福利，開啟財富爆發之旅！`,
      en: `⚡️ ${name} is now open! Tap to secure your personalized ${strategyType} rewards instantly!`
    },
    whatsapp: {
      zh: `🤝 您好！為您特別定製的「${name}」正式啟動。這是一項【${strategyType}】特惠方案，助您資產快速增長！詳情見：https://example.com/c`,
      en: `🤝 Hello! Your personalized "${name}" has launched. A unique [${strategyType}] program to accelerate your crypto growth! Details: https://example.com/c`
    }
  };

  return {
    segment,
    name,
    strategyType,
    parameters,
    detailsMarkdown,
    copies,
    windowDays,
    channels: ["email", "push"]
  };
}

// API Endpoints

// 1. Get Users
app.get("/api/users", (req, res) => {
  const db = getDB();
  res.json(db.users);
});

// 2. Get Campaigns
app.get("/api/campaigns", (req, res) => {
  const db = getDB();
  res.json(db.campaigns);
});

// 3. Get Rules
app.get("/api/rules", (req, res) => {
  const db = getDB();
  res.json(db.rules);
});

// 4. Reset DB (very useful for showcasing demo)
app.post("/api/users/reset", (req, res) => {
  const defaultDB: DB = {
    users: JSON.parse(JSON.stringify(seedUsers)),
    campaigns: JSON.parse(JSON.stringify(seedCampaigns)),
    rules: JSON.parse(JSON.stringify(seedRules))
  };
  saveDB(defaultDB);
  res.json({ message: "Database reset to initial seed state successfully.", db: defaultDB });
});

// 5. Generate Campaign Strategy using Gemini or Fallback
app.post("/api/campaigns/generate", async (req, res) => {
  const { segment } = req.body;
  if (!segment) {
    return res.status(400).json({ error: "Missing segment parameter" });
  }

  const db = getDB();
  const client = getGeminiClient();

  // If client is missing, use rule-based fallback
  if (!client) {
    console.log("Using rule-based fallback generator for", segment);
    const campaignDetails = generateFallbackCampaign(segment, db.rules);
    return res.json(campaignDetails);
  }

  try {
    // Construct adjustments string for the AI prompt to enforce closed-loop optimization
    const stageAdjustments = db.rules.adjustments.filter(a => a.stage === segment);
    let rulesInstruction = "";
    if (stageAdjustments.length > 0) {
      rulesInstruction = "IMPORTANT CRITICAL INSTRUCTION (Approved from previous optimization iterations):\n" +
        stageAdjustments.map(a => `- Current approved rule for this stage: "${a.proposedChange}" based on rationale: "${a.rationale}"`).join("\n") +
        "\nYou MUST adapt your strategy and parameter generation to enforce these rules.";
    }

    const prompt = `You are a professional marketing director at a top-tier cryptocurrency exchange.
Your goal is to generate a smart marketing campaign strategy for a specific cohort of users.

Target User Cohort Segment (Conversion Stage): "${segment}"

Marketing Strategy Constraints:
- FOCUS ENTIRELY ON: FTD (First deposit), Repeat Deposit (复投/多次充值), or FTT (First trade).
- NEVER encourage, prompt, or refer to withdrawals (FTW - First Withdrawal) or withdrawing assets.
- If the segment is "已交易(FTT)未复投" or similar, focus on motivating them to deposit more funds (复投).
- If the segment is "KYC已通过未入金", focus on motivating first-time deposit (FTD).
- If the segment is "已入金(FTD)未交易", focus on first-time trade (FTT).
- Choose between these Strategy Types: "资金激励类" (bonus, fee cashbacks), "内容教育类" (video course, booklets, grid trading tutorials), or "限时/紧迫感类" (limited discount, urgent bonus).

Approved Optimization Directives to enforce:
${rulesInstruction}

Please generate the campaign with the following parameters:
1. "name": A catchy, professional Chinese name for this campaign.
2. "strategyType": Must be exactly one of "资金激励类", "内容教育类", "限时/紧迫感类".
3. "parameters": An object containing optional parameters:
   - "bonusPct": (number, e.g. 10 or 15) bonus percentage if applicable.
   - "maxBonus": (number, e.g. 50 or 100) maximum bonus value in USDT.
   - "courseTitle": (string) title of the video course / guide if it's educational.
   - "durationHours": (number, e.g. 24 or 72) limit time period.
   - "incentiveDetail": (string) extra parameter details.
4. "detailsMarkdown": Explaining the rationale, target audience painpoints, strategy mechanics, and campaign timeline.
5. "copies": Custom marketing messages for multiple communication channels. Each channel requires copies in both "zh" (Traditional Chinese, since exchanges commonly target users in Hong Kong/Taiwan/Global Chinese) and "en" (English):
   - "email": Complete HTML/Markdown email content with structured greetings, body, incentives, call-to-action button placeholders.
     - IMPORTANT: The email copy MUST include a short, elegant call-to-action to join our official Telegram channel (https://t.me/CryptoExchange) and WhatsApp support community (https://chat.whatsapp.com/CryptoCommunity).
   - "sms": Clear, concise, standard SMS copy with call-to-action link placeholder (maximum 120 characters for Chinese, 200 for English).
   - "push": Highly engaging App Push Notification (brief title + body, max 60 chars).
   - "whatsapp": High-converting WhatsApp conversational message containing structured details.
6. "windowDays": (number) Conversion tracking window in days. Must be:
   - 3 days for KYC-related campaigns
   - 7 days for deposit/FTD/repeat deposit campaigns
   - 14 days for trading/FTT campaigns

You must respond in a strict JSON format matching the schema.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["name", "strategyType", "parameters", "detailsMarkdown", "copies", "windowDays"],
          properties: {
            name: { type: Type.STRING, description: "Chinese name of the campaign" },
            strategyType: { 
              type: Type.STRING, 
              enum: ["资金激励类", "内容教育类", "限时/紧迫感类"],
              description: "The category of the campaign" 
            },
            parameters: {
              type: Type.OBJECT,
              properties: {
                bonusPct: { type: Type.NUMBER },
                maxBonus: { type: Type.NUMBER },
                courseTitle: { type: Type.STRING },
                durationHours: { type: Type.NUMBER },
                incentiveDetail: { type: Type.STRING }
              }
            },
            detailsMarkdown: { type: Type.STRING, description: "Detailed strategy breakdown in Chinese Markdown" },
            windowDays: { type: Type.INTEGER, description: "Target evaluation window in days (3, 7, 14)" },
            copies: {
              type: Type.OBJECT,
              required: ["email", "sms", "push", "whatsapp"],
              properties: {
                email: {
                  type: Type.OBJECT,
                  required: ["zh", "en"],
                  properties: {
                    zh: { type: Type.STRING, description: "Email in traditional Chinese including TG/WA links" },
                    en: { type: Type.STRING, description: "Email in English including TG/WA links" }
                  }
                },
                sms: {
                  type: Type.OBJECT,
                  required: ["zh", "en"],
                  properties: {
                    zh: { type: Type.STRING, description: "SMS in Chinese" },
                    en: { type: Type.STRING, description: "SMS in English" }
                  }
                },
                push: {
                  type: Type.OBJECT,
                  required: ["zh", "en"],
                  properties: {
                    zh: { type: Type.STRING, description: "Push notification in Chinese" },
                    en: { type: Type.STRING, description: "Push notification in English" }
                  }
                },
                whatsapp: {
                  type: Type.OBJECT,
                  required: ["zh", "en"],
                  properties: {
                    zh: { type: Type.STRING, description: "WhatsApp copy in Chinese" },
                    en: { type: Type.STRING, description: "WhatsApp copy in English" }
                  }
                }
              }
            }
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (err) {
    console.error("Gemini strategy generation failed, falling back...", err);
    // Secure fallback strategy
    const campaignDetails = generateFallbackCampaign(segment, db.rules);
    res.json(campaignDetails);
  }
});

// 6. Save/Edit Campaign (as Draft or Updated details)
app.post("/api/campaigns/save", (req, res) => {
  const campaignData = req.body;
  const db = getDB();

  if (!campaignData.id) {
    // Generate new ID
    campaignData.id = "c-" + Math.floor(100 + Math.random() * 900);
    campaignData.createdAt = new Date().toISOString();
    campaignData.status = "draft";
    campaignData.touchMetrics = {
      email: { sent: 0, opened: 0 },
      sms: { sent: 0 },
      push: { sent: 0, opened: 0 },
      whatsapp: { sent: 0 }
    };
    campaignData.convertedUserIds = [];
    campaignData.convertedCount = 0;
    campaignData.conversionRate = 0;
    campaignData.optimizationStatus = "none";
    db.campaigns.unshift(campaignData);
  } else {
    // Edit existing
    const idx = db.campaigns.findIndex(c => c.id === campaignData.id);
    if (idx !== -1) {
      db.campaigns[idx] = { ...db.campaigns[idx], ...campaignData };
    }
  }

  saveDB(db);
  res.json({ message: "Campaign saved successfully", campaign: campaignData });
});

// 7. Launch Campaign
app.post("/api/campaigns/launch", (req, res) => {
  const { id, channels } = req.body;
  const db = getDB();

  const idx = db.campaigns.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const campaign = db.campaigns[idx];

  // Find all targeted users in the segment
  const targetedUsers = db.users.filter(u => u.stage === campaign.segment);
  const targetedUserIds = targetedUsers.map(u => u.id);

  campaign.channels = channels || campaign.channels || ["email"];
  campaign.targetedUserIds = targetedUserIds;
  campaign.targetsCount = targetedUserIds.length;
  campaign.status = "active";
  campaign.sentAt = new Date().toISOString();

  // Simulate Channel Touch Delivery Success Rate (from contract)
  // Generates some mock delivery success & open logs
  const count = targetedUserIds.length;
  campaign.touchMetrics = {
    email: {
      sent: campaign.channels.includes("email") ? count : 0,
      opened: campaign.channels.includes("email") ? Math.floor(count * (0.6 + Math.random() * 0.3)) : 0
    },
    sms: {
      sent: campaign.channels.includes("sms") ? count : 0
    },
    push: {
      sent: campaign.channels.includes("push") ? count : 0,
      opened: campaign.channels.includes("push") ? Math.floor(count * (0.3 + Math.random() * 0.4)) : 0
    },
    whatsapp: {
      sent: campaign.channels.includes("whatsapp") ? count : 0
    }
  };

  db.campaigns[idx] = campaign;
  saveDB(db);

  res.json({ message: "Campaign launched successfully!", campaign });
});

// Helper for realistic probability-based conversion calculation
function calculateConversionProbability(user: User, campaign: Campaign): number {
  let baseProbability = 0.15; // 15% default base rate

  // Strategy type preference matching
  if (campaign.strategyType === "资金激励类") {
    // High-risk and large-capital users prefer incentives
    if (user.riskPreference === "激进") baseProbability += 0.10;
    if (user.capitalScale === "大额") baseProbability += 0.08;
    // Pct of bonus influences probability
    if (campaign.parameters?.bonusPct) {
      baseProbability += (campaign.parameters.bonusPct - 10) * 0.02; // +2% for each 1% over 10%
    }
  } else if (campaign.strategyType === "内容教育类") {
    // Beginner/Conservative/Small-capital users prefer content education
    if (user.investmentExperience === "新手") baseProbability += 0.15;
    if (user.riskPreference === "保守") baseProbability += 0.10;
    if (user.capitalScale === "小额") baseProbability += 0.05;
  } else if (campaign.strategyType === "限时/紧迫感类") {
    // Shorter duration hours creates more urgency, active users convert faster
    if (user.lastActiveDays <= 2) baseProbability += 0.08;
    if (campaign.parameters?.durationHours && campaign.parameters.durationHours <= 24) {
      baseProbability += 0.05;
    }
  }

  // Channel channels contribution (more channels = higher touch chance)
  const channelsCount = campaign.channels.length;
  baseProbability += (channelsCount - 1) * 0.04;

  // Active status influence (more active users convert easier)
  if (user.lastActiveDays > 10) {
    baseProbability -= 0.10; // silent users harder to convert
  }

  return Math.max(0.02, Math.min(0.85, baseProbability));
}

// 8. Advance Simulation Time (Time Travel)
app.post("/api/simulate/advance", async (req, res) => {
  const { days } = req.body;
  const numDays = parseInt(days) || 1;

  const db = getDB();
  const logs: string[] = [];
  const client = getGeminiClient();

  // 1. Advance stayDays & lastActiveDays of ALL users
  db.users.forEach(u => {
    u.stayDays += numDays;
    u.lastActiveDays += numDays;
    // Check churn risk (if stay in KYC passed no deposit > 10 days, or silent > 7 days)
    if (u.lastActiveDays > 14) {
      u.churnRisk = true;
    }
  });

  logs.push(`時間向前推進了 ${numDays} 天。所有用戶的階段停留時間與沉默時間均增加了 ${numDays} 天。`);

  // 2. Process ACTIVE campaigns
  for (let cIdx = 0; cIdx < db.campaigns.length; cIdx++) {
    const campaign = db.campaigns[cIdx];
    if (campaign.status !== "active") continue;

    const sentDate = new Date(campaign.sentAt || campaign.createdAt);
    const elapsedDays = Math.floor((Date.now() - sentDate.getTime()) / (24 * 60 * 60 * 1000)) + numDays;

    logs.push(`正在處理活動【${campaign.name}】的轉化統計，當前已投放 ${elapsedDays} 天 (窗口期：${campaign.windowDays} 天)`);

    // For each targeted user, if not converted yet, simulate conversion probability
    const newlyConvertedIds: string[] = [];
    const targetStage = campaign.segment;

    // Get the next stage to transition user to
    let nextStage: UserStage = UserStage.FTD_NO_TRADE;
    if (targetStage === UserStage.UNREGISTERED) nextStage = UserStage.REGISTERED_NO_KYC;
    else if (targetStage === UserStage.REGISTERED_NO_KYC) nextStage = UserStage.KYC_UNDER_REVIEW;
    else if (targetStage === UserStage.KYC_UNDER_REVIEW) nextStage = UserStage.KYC_PASSED_NO_DEPOSIT;
    else if (targetStage === UserStage.KYC_PASSED_NO_DEPOSIT) nextStage = UserStage.FTD_NO_TRADE; // First Deposit FTD!
    else if (targetStage === UserStage.FTD_NO_TRADE) nextStage = UserStage.FTT_NO_REDEPOSIT; // First Trade FTT!
    else if (targetStage === UserStage.FTT_NO_REDEPOSIT) nextStage = UserStage.REDEPOSITED; // Repeat Deposit!
    else nextStage = UserStage.REDEPOSITED;

    campaign.targetedUserIds.forEach(uId => {
      // If already converted in this campaign, skip
      if (campaign.convertedUserIds.includes(uId)) return;

      const user = db.users.find(u => u.id === uId);
      if (!user) return;

      // Calculate customized conversion rate
      const prob = calculateConversionProbability(user, campaign);
      const isConverted = Math.random() < prob;

      if (isConverted) {
        newlyConvertedIds.push(uId);
        campaign.convertedUserIds.push(uId);

        // Update the actual user state in database!
        user.stage = nextStage;
        user.stayDays = 0; // reset stay duration
        user.lastActiveDays = 0; // reset silent counter
        user.churnRisk = false;

        logs.push(`🎯 用戶【${user.name}】受活動影響，成功轉化至：${nextStage}`);
      }
    });

    campaign.convertedCount = campaign.convertedUserIds.length;
    campaign.conversionRate = parseFloat(((campaign.convertedCount / Math.max(1, campaign.targetsCount)) * 100).toFixed(1));

    // If campaign reaches or exceeds the evaluation window, complete it and trigger AI optimization!
    if (elapsedDays >= campaign.windowDays) {
      campaign.status = "completed";
      campaign.completedAt = new Date().toISOString();
      campaign.optimizationStatus = "pending";

      logs.push(`⏱️ 活動【${campaign.name}】已達窗口期上限，狀態變更為：【已完成】。開始生成 AI 策略優化分析建議...`);

      // Generate Optimization Recommendation using Gemini or Fallback
      if (client) {
        try {
          const optPrompt = `You are a marketing strategy optimizer at a cryptocurrency exchange.
Analyze the following completed marketing campaign and generate a closed-loop Optimization Recommendation.

Campaign Details:
- Name: "${campaign.name}"
- Target Segment: "${campaign.segment}"
- Strategy Type: "${campaign.strategyType}"
- Parameters: ${JSON.stringify(campaign.parameters)}
- Targets Count: ${campaign.targetsCount}
- Converted Count: ${campaign.convertedCount}
- Realized Conversion Rate: ${campaign.conversionRate}%
- Channels Configured: ${JSON.stringify(campaign.channels)}
- Channel Deliveries/Opens: ${JSON.stringify(campaign.touchMetrics)}

Please output a JSON containing:
1. "summary": A brief 1-sentence headline of the suggestion.
2. "rationale": Detailed rationale in Chinese explaining WHY this performed well/poorly, analyzing user attributes, channels, or incentives.
3. "proposedChange": A specific, actionable directive in Chinese to adjust subsequent campaign rules (e.g. "针对已入金未交易用户，将【资金激励类】方案完全切换为以網格交易、首單虧損補貼為特色的【內容教育類】方案", "在HK/SG等地區將渠道重點調配至WhatsApp，因郵件打開率僅為15%").

Keep responses concise and direct.`;

          const optResponse = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: optPrompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                required: ["summary", "rationale", "proposedChange"],
                properties: {
                  summary: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  proposedChange: { type: Type.STRING }
                }
              }
            }
          });

          campaign.optimizationSuggestion = JSON.parse(optResponse.text.trim());
          logs.push(`🤖 Gemini 已成功生成優化改進方案："${campaign.optimizationSuggestion?.summary}"`);
        } catch (e) {
          console.error("Failed to generate AI optimization recommendation:", e);
          campaign.optimizationSuggestion = {
            summary: "活動轉化率評估完畢，建議微調激勵比例",
            rationale: `本次活動最終實現了 ${campaign.conversionRate}% 的註冊/激活轉化率。主要瓶頸在於中低頻活躍用戶對本方案類型觸發不敏感。`,
            proposedChange: "建議在下一輪活動生成中，將策略力度增加5%，並擴展WhatsApp社群觸達渠道。"
          };
        }
      } else {
        // Fallback optimization suggestions
        let proposedChange = "建議增加活動預算與返點比例 5%";
        let summary = "活動轉化分析已就緒，建議提升權益額度";
        let rationale = `本次活動轉化率為 ${campaign.conversionRate}%。數據表明，高頻活跃用戶轉化正常，但低頻/沉默用戶缺乏參與動機。`;

        if (campaign.segment === UserStage.KYC_PASSED_NO_DEPOSIT) {
          proposedChange = "針對KYC通過未入金用戶，將首充迎新贈金比例從 10% 提升至 15%，或增設【新手法寶視頻課】";
          summary = "首充贈金吸引力不足，建議提升比例或疊加新手課程";
        } else if (campaign.segment === UserStage.FTD_NO_TRADE) {
          proposedChange = "將已入金未交易用戶的策略全面由【資金激勵類】調整為【內容教育類】，如贈送網格策略跟單指南";
          summary = "入金後交易卡點在於技巧認知，建議全面切換為新手教學類引導";
        }

        campaign.optimizationSuggestion = { summary, rationale, proposedChange };
        logs.push(`🤖 系統自動生成了優化改進建議："${summary}"`);
      }
    }

    db.campaigns[cIdx] = campaign;
  }

  saveDB(db);
  res.json({ logs, db });
});

// 9. Approve Recommendation
app.post("/api/rules/approve", (req, res) => {
  const { campaignId } = req.body;
  const db = getDB();

  const cIdx = db.campaigns.findIndex(c => c.id === campaignId);
  if (cIdx === -1) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const campaign = db.campaigns[cIdx];
  if (!campaign.optimizationSuggestion || campaign.optimizationStatus !== "pending") {
    return res.status(400).json({ error: "No pending optimization to approve" });
  }

  campaign.optimizationStatus = "approved";

  // Insert this into the active rules list so future AI prompts use it!
  const newAdjustment = {
    id: "adj-" + Math.floor(100 + Math.random() * 900),
    stage: campaign.segment,
    proposedChange: campaign.optimizationSuggestion.proposedChange,
    rationale: campaign.optimizationSuggestion.rationale,
    approvedAt: new Date().toISOString()
  };

  db.rules.adjustments.unshift(newAdjustment);
  db.rules.lastUpdate = new Date().toISOString();

  db.campaigns[cIdx] = campaign;
  saveDB(db);

  res.json({ message: "Optimization recommendation approved & written to active marketing rules!", campaign, rules: db.rules });
});

// 10. Reject Recommendation
app.post("/api/rules/reject", (req, res) => {
  const { campaignId } = req.body;
  const db = getDB();

  const cIdx = db.campaigns.findIndex(c => c.id === campaignId);
  if (cIdx === -1) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const campaign = db.campaigns[cIdx];
  campaign.optimizationStatus = "rejected";

  db.campaigns[cIdx] = campaign;
  saveDB(db);

  res.json({ message: "Recommendation rejected", campaign });
});


// Serve Static Assets & SPA Routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Marketing Server running on http://localhost:${PORT}`);
  });
}

startServer();
