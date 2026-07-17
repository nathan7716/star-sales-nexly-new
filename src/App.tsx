import { useState, useEffect } from "react";
import {
  Users,
  Target,
  Zap,
  BarChart3,
  Bot,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  Clock,
  Coins,
  Globe,
  Settings,
  ShieldCheck,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  TrendingUp,
  FileText,
  ChevronRight,
  BookOpen
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import ReactMarkdown from "react-markdown";
import { UserStage, User, Campaign, AIRules, StrategyType } from "./types";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#64748b"];

export default function App() {
  const [activeTab, setActiveTab] = useState<"cdp" | "campaign-builder" | "monitor" | "optimization">("cdp");
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rules, setRules] = useState<AIRules>({ lastUpdate: "", adjustments: [] });
  const [selectedStage, setSelectedStage] = useState<UserStage>(UserStage.KYC_PASSED_NO_DEPOSIT);
  
  // CDP Filter States
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterMinStayDays, setFilterMinStayDays] = useState<string>("");
  const [filterMaxStayDays, setFilterMaxStayDays] = useState<string>("");
  const [filterMinSilentDays, setFilterMinSilentDays] = useState<string>("");
  const [filterMaxSilentDays, setFilterMaxSilentDays] = useState<string>("");
  const [filterRiskPreference, setFilterRiskPreference] = useState<string>("");
  const [filterInvestmentExperience, setFilterInvestmentExperience] = useState<string>("");
  const [filterCapitalScale, setFilterCapitalScale] = useState<string>("");
  const [filterChurnRisk, setFilterChurnRisk] = useState<string>("");
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>("");

  // Strategy Builder State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<Partial<Campaign> | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<"zh" | "en">("zh");
  const [selectedChannels, setSelectedChannels] = useState<("email" | "sms" | "push" | "whatsapp")[]>(["email", "push"]);
  const [copyTab, setCopyTab] = useState<"email" | "sms" | "push" | "whatsapp">("email");

  // Simulation State
  const [simDaysToAdvance, setSimDaysToAdvance] = useState<number>(1);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    "系统初始化完毕。所有标签数据成功由外部CDP系统拉取同步。",
    "已就绪：当前有 3 个用户卡在「KYC已通过未入金」阶段，建议尽快投放首充赠金活动。"
  ]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      setUsers(usersData);

      const campaignsRes = await fetch("/api/campaigns");
      const campaignsData = await campaignsRes.json();
      setCampaigns(campaignsData);

      const rulesRes = await fetch("/api/rules");
      const rulesData = await rulesRes.json();
      setRules(rulesData);
    } catch (e) {
      console.error("Failed to fetch initial backend data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Trigger AI Generation for Strategy & Copy
  const handleGenerateStrategy = async () => {
    setIsGenerating(true);
    setActiveTab("campaign-builder");
    try {
      const response = await fetch("/api/campaigns/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment: selectedStage })
      });
      const data = await response.json();
      setGeneratedCampaign(data);
      // Select appropriate channels based on suggestion
      if (data.channels && data.channels.length > 0) {
        setSelectedChannels(data.channels);
      }
    } catch (err) {
      console.error("Failed to generate campaign", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Launch the campaign
  const handleLaunchCampaign = async () => {
    if (!generatedCampaign) return;
    try {
      // Save campaign draft first
      const saveRes = await fetch("/api/campaigns/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedCampaign)
      });
      const saveData = await saveRes.json();
      const campaignId = saveData.campaign.id;

      // Launch campaign with selected channels
      const launchRes = await fetch("/api/campaigns/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaignId, channels: selectedChannels })
      });
      const launchData = await launchRes.json();

      setSimulationLogs(prev => [
        `🚀 活動啟動成功！「${generatedCampaign.name}」已正式面向 ${launchData.campaign.targetsCount} 位【${selectedStage}】階段客戶投放。`,
        ...prev
      ]);

      // Refetch data
      await fetchData();
      setGeneratedCampaign(null);
      setActiveTab("monitor");
    } catch (e) {
      console.error("Launch campaign failed", e);
    }
  };

  // Run Sandbox Time Travel Simulation
  const handleAdvanceTime = async (days: number) => {
    setIsSimulating(true);
    try {
      const response = await fetch("/api/simulate/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days })
      });
      const data = await response.json();
      
      // Prepend simulation logs
      setSimulationLogs(prev => [...data.logs.reverse(), ...prev]);
      
      // Update local states
      setUsers(data.db.users);
      setCampaigns(data.db.campaigns);
      setRules(data.db.rules);
    } catch (e) {
      console.error("Simulation failed", e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Reset database back to seed state
  const handleResetDatabase = async () => {
    if (!window.confirm("确定要重置所有模拟数据和历史活动日志吗？这将还原为最原始的产品 Demo 状态。")) return;
    try {
      const response = await fetch("/api/users/reset", { method: "POST" });
      const data = await response.json();
      setUsers(data.db.users);
      setCampaigns(data.db.campaigns);
      setRules(data.db.rules);
      setSimulationLogs([
        "🔄 数据库已成功重置！Demo 数据已还原到初始种子状态。",
        "已就绪：当前有 3 个用户卡在「KYC已通过未入金」阶段，建议尽快投放首充赠金活动。"
      ]);
      setGeneratedCampaign(null);
      setActiveTab("cdp");
    } catch (e) {
      console.error("Reset database failed", e);
    }
  };

  // Approve AI Optimization suggestion
  const handleApproveRule = async (campaignId: string) => {
    try {
      const response = await fetch("/api/rules/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId })
      });
      const data = await response.json();
      
      setSimulationLogs(prev => [
        `✅ 审批通过：优化建议已转为核心营销规则，将应用于下一轮【${data.campaign.segment}】的 AI 方案生成！`,
        ...prev
      ]);
      
      await fetchData();
    } catch (e) {
      console.error("Approve rule failed", e);
    }
  };

  // Reject AI Optimization suggestion
  const handleRejectRule = async (campaignId: string) => {
    try {
      const response = await fetch("/api/rules/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId })
      });
      await response.json();
      
      setSimulationLogs(prev => [
        `❌ 审批驳回：活动优化建议已被运营退回。`,
        ...prev
      ]);
      
      await fetchData();
    } catch (e) {
      console.error("Reject rule failed", e);
    }
  };

  // Filter users by selected stage
  const selectedStageUsers = users.filter(u => u.stage === selectedStage);

  // Compute stats for selected stage
  const stayDaysAverage = selectedStageUsers.length > 0 
    ? Math.round(selectedStageUsers.reduce((acc, u) => acc + u.stayDays, 0) / selectedStageUsers.length)
    : 0;

  const silentDaysAverage = selectedStageUsers.length > 0
    ? Math.round(selectedStageUsers.reduce((acc, u) => acc + u.lastActiveDays, 0) / selectedStageUsers.length)
    : 0;

  // Chart data: Risk distribution in selected stage
  const riskStats = selectedStageUsers.reduce((acc: any, u) => {
    acc[u.riskPreference] = (acc[u.riskPreference] || 0) + 1;
    return acc;
  }, {});
  const riskChartData = Object.keys(riskStats).map(key => ({ name: key, value: riskStats[key] }));

  // Chart data: Capital Scale distribution in selected stage
  const capitalStats = selectedStageUsers.reduce((acc: any, u) => {
    acc[u.capitalScale] = (acc[u.capitalScale] || 0) + 1;
    return acc;
  }, {});
  const capitalChartData = Object.keys(capitalStats).map(key => ({ name: key, value: capitalStats[key] }));

  // Apply real-time client-side filters for the customer list table
  const filteredStageUsers = selectedStageUsers.filter((user) => {
    // 1. Target user search (name, email, phone)
    if (filterSearchQuery) {
      const query = filterSearchQuery.toLowerCase();
      const matchName = user.name?.toLowerCase().includes(query);
      const matchEmail = user.email?.toLowerCase().includes(query);
      const matchPhone = user.phone?.toLowerCase().includes(query);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }

    // 2. Region filter
    if (filterRegion && user.region !== filterRegion) return false;

    // 3. Stay days filter
    if (filterMinStayDays !== "") {
      const minDays = parseInt(filterMinStayDays);
      if (!isNaN(minDays) && user.stayDays < minDays) return false;
    }
    if (filterMaxStayDays !== "") {
      const maxDays = parseInt(filterMaxStayDays);
      if (!isNaN(maxDays) && user.stayDays > maxDays) return false;
    }

    // 4. Silent days filter
    if (filterMinSilentDays !== "") {
      const minSilent = parseInt(filterMinSilentDays);
      if (!isNaN(minSilent) && user.lastActiveDays < minSilent) return false;
    }
    if (filterMaxSilentDays !== "") {
      const maxSilent = parseInt(filterMaxSilentDays);
      if (!isNaN(maxSilent) && user.lastActiveDays > maxSilent) return false;
    }

    // 5. Portrait Tags (Risk preference, Investment Experience, Capital Scale)
    if (filterRiskPreference) {
      const p = filterRiskPreference;
      const uRisk = user.riskPreference;
      const isMatch = (p === "激进" && (uRisk === "激进" || uRisk === "激進")) ||
                      (p === "激進" && (uRisk === "激进" || uRisk === "激進")) ||
                      uRisk === p;
      if (!isMatch) return false;
    }

    if (filterInvestmentExperience && user.investmentExperience !== filterInvestmentExperience) return false;

    if (filterCapitalScale) {
      const scale = filterCapitalScale;
      const uScale = user.capitalScale;
      const isMatch = (scale === "大额" && (uScale === "大额" || uScale === "大額")) ||
                      (scale === "大額" && (uScale === "大额" || uScale === "大額")) ||
                      (scale === "中额" && (uScale === "中额" || uScale === "中額")) ||
                      (scale === "中額" && (uScale === "中额" || uScale === "中額")) ||
                      (scale === "小额" && (uScale === "小额" || uScale === "小額")) ||
                      (scale === "小額" && (uScale === "小额" || uScale === "小額")) ||
                      uScale === scale;
      if (!isMatch) return false;
    }

    // 6. Churn Risk
    if (filterChurnRisk === "high" && !user.churnRisk) return false;
    if (filterChurnRisk === "normal" && user.churnRisk) return false;

    return true;
  });

  // Count users per stage for stage summary
  const getStageUserCount = (stage: UserStage) => users.filter(u => u.stage === stage).length;

  return (
    <div className="h-screen w-screen bg-[#F1F3F5] text-[#212529] flex flex-col overflow-hidden font-sans" id="app-root-container">
      
      {/* HEADER SECTION */}
      <header className="h-14 bg-white border-b border-gray-300 flex items-center justify-between px-6 shrink-0 shadow-sm z-10" id="app-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#212529] flex items-center">
              智能营销系统 (Intelligent Marketing Engine)
              <span className="text-[10px] font-normal text-gray-400 ml-2">v0.1 / July 16, 2026</span>
            </h1>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">AI 驱动交易所全自动激活与渠道文案生成自适应闭环</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[9px] text-gray-400 uppercase leading-none">全量客户</p>
              <p className="text-xs font-mono font-bold text-blue-600 leading-none mt-1">{users.length} Users</p>
            </div>
            <div className="text-right border-l pl-4 border-gray-300">
              <p className="text-[9px] text-gray-400 uppercase leading-none">进行中活动</p>
              <p className="text-xs font-mono font-bold text-gray-700 leading-none mt-1">
                {campaigns.filter(c => c.status === "active").length} Active
              </p>
            </div>
            <div className="text-right border-l pl-4 border-gray-300">
              <p className="text-[9px] text-gray-400 uppercase leading-none">自适应规则</p>
              <p className="text-xs font-mono font-bold text-green-600 leading-none mt-1">
                {rules.adjustments.length} Rules
              </p>
            </div>
          </div>
          
          <button
            onClick={handleResetDatabase}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded border border-gray-300 transition cursor-pointer"
            id="btn-reset-db"
          >
            <RefreshCw className="w-3 h-3 text-gray-500" />
            <span>重置数据</span>
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <div className="flex flex-1 overflow-hidden" id="core-workspace">
        
        {/* SIDEBAR NAVIGATION */}
        <nav className="w-56 bg-white border-r border-gray-300 p-4 flex flex-col gap-1 shrink-0 h-full overflow-y-auto" id="sidebar-nav">
          <div className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-2 tracking-widest font-sans">主控制台 Console</div>
          
          <button
            onClick={() => setActiveTab("cdp")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium border-l-2 transition-all cursor-pointer ${
              activeTab === "cdp"
                ? "bg-blue-50 text-blue-700 border-blue-600 font-bold"
                : "text-gray-600 hover:bg-gray-50 border-transparent"
            }`}
            id="nav-tab-cdp"
          >
            <Users className="w-3.5 h-3.5 shrink-0 text-gray-500" />
            <span>CDP 客户分群</span>
          </button>

          <button
            onClick={() => setActiveTab("campaign-builder")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium border-l-2 transition-all relative cursor-pointer ${
              activeTab === "campaign-builder"
                ? "bg-blue-50 text-blue-700 border-blue-600 font-bold"
                : "text-gray-600 hover:bg-gray-50 border-transparent"
            }`}
            id="nav-tab-builder"
          >
            <Bot className="w-3.5 h-3.5 shrink-0 text-gray-500" />
            <span>AI 策略与文案</span>
            {generatedCampaign && (
              <span className="absolute right-2 top-3.5 w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("monitor")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium border-l-2 transition-all relative cursor-pointer ${
              activeTab === "monitor"
                ? "bg-blue-50 text-blue-700 border-blue-600 font-bold"
                : "text-gray-600 hover:bg-gray-50 border-transparent"
            }`}
            id="nav-tab-monitor"
          >
            <Zap className="w-3.5 h-3.5 shrink-0 text-gray-500" />
            <span>运行与模拟</span>
            {campaigns.some(c => c.status === "active") && (
              <span className="absolute right-2 top-3.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("optimization")}
            className={`flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium border-l-2 transition-all relative cursor-pointer ${
              activeTab === "optimization"
                ? "bg-blue-50 text-blue-700 border-blue-600 font-bold"
                : "text-gray-600 hover:bg-gray-50 border-transparent"
            }`}
            id="nav-tab-optimization"
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0 text-gray-500" />
            <span>自适应优化</span>
            {campaigns.some(c => c.optimizationStatus === "pending") && (
              <span className="absolute right-2 top-2 bg-red-500 text-white text-[9px] px-1 py-0.2 rounded-full font-bold">
                {campaigns.filter(c => c.optimizationStatus === "pending").length}
              </span>
            )}
          </button>

          <div className="mt-6 text-[10px] font-bold text-gray-400 uppercase px-2 mb-2 tracking-widest font-sans">业务合规 Policy</div>
          <div className="bg-amber-50 rounded p-3 border border-amber-200 text-[10px] text-amber-800" id="compliance-card">
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">合规核心准则</p>
                <p className="mt-0.5 leading-relaxed text-amber-950">
                  系统不包含引导提现目标。FTW 仅做为流失信号以供人工客服介入参考。
                </p>
              </div>
            </div>
          </div>
        </nav>

        {/* MAIN WORKBENCH AREA */}
        <main className="flex-1 p-5 overflow-hidden bg-[#F1F3F5]" id="main-workbench">
          
          {/* TAB 1: CDP INSIGHTS & USERS */}
          {activeTab === "cdp" && (
            <div className="grid grid-cols-12 gap-5 h-full overflow-hidden" id="tab-cdp-container">
              
              {/* Left Column: CDP Stage List */}
              <div className="col-span-4 flex flex-col h-full overflow-hidden bg-white border border-gray-300 rounded shadow-xs" id="cdp-stage-sidebar">
                <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">客群标签分段 (CDP)</h2>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-bold">
                    {Object.values(UserStage).length} 类别
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {Object.values(UserStage).map((stage) => {
                    const count = getStageUserCount(stage);
                    const isSelected = selectedStage === stage;
                    
                    let subtext = "";
                    if (stage === UserStage.KYC_PASSED_NO_DEPOSIT) subtext = "🔥 首充 FTD 核心转化点";
                    if (stage === UserStage.FTD_NO_TRADE) subtext = "🎯 首笔交易 FTT 核心转化点";
                    if (stage === UserStage.FTT_NO_REDEPOSIT) subtext = "⚡ 复投资产增值转化点";
                    if (stage === UserStage.FTW_COMPLETED) subtext = "🛡️ 流失风险识别 (提现)";
                    if (stage === UserStage.CHURNED_SILENT) subtext = "💤 沉默流失客户重激活";
                    if (stage === UserStage.REDEPOSITED) subtext = "💎 优质资产沉淀复投客群";

                    return (
                      <div
                        key={stage}
                        onClick={() => setSelectedStage(stage)}
                        className={`p-3.5 cursor-pointer transition-all border-l-4 ${
                          isSelected
                            ? "bg-blue-50/50 border-l-blue-600 font-medium"
                            : "hover:bg-gray-50/80 border-l-transparent"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`text-xs font-bold ${isSelected ? "text-blue-900" : "text-gray-800"}`}>
                            {stage}
                          </h3>
                          <span className={`text-[10px] font-mono font-medium ${isSelected ? "text-blue-600" : "text-gray-500"}`}>
                            {count} Users
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{subtext}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 bg-gray-50 text-[10px] text-gray-400 text-center border-t border-gray-100 shrink-0">
                  CDP 实时拉取同步 • 正常
                </div>
              </div>

              {/* Right Column: Detailed Stage Analytics & User List */}
              <div className="col-span-8 flex flex-col gap-5 h-full overflow-y-auto" id="cdp-stage-details">
                
                {/* Active Segment Summary */}
                <div className="bg-white border border-gray-300 p-5 flex flex-col gap-4 rounded shadow-xs" id="cdp-stage-summary-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block font-sans">当前探针分段</span>
                      <h2 className="text-base font-bold mt-1 text-gray-900">{selectedStage}</h2>
                    </div>
                    <button
                      onClick={handleGenerateStrategy}
                      disabled={selectedStageUsers.length === 0}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                      id="btn-generate-ai-strategy"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI 一键生成多渠道方案</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-y border-gray-200 py-4 font-sans">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-0.5">群体规模</p>
                      <p className="text-xs font-bold text-gray-800 underline decoration-blue-500 underline-offset-4">{selectedStageUsers.length} 人</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-0.5">平均停留天数</p>
                      <p className="text-xs font-bold text-gray-800 underline decoration-blue-500 underline-offset-4">
                        {stayDaysAverage} 天 {stayDaysAverage > 7 ? "⚠️ 超过黄金期" : "✅ 高转化窗口"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-0.5">平均沉默天数</p>
                      <p className="text-xs font-bold text-gray-800 underline decoration-blue-500 underline-offset-4">{silentDaysAverage} 天</p>
                    </div>
                  </div>

                  {/* MINI BENTO CHART GRID */}
                  {selectedStageUsers.length > 0 && (
                    <div className="grid grid-cols-2 gap-4" id="cdp-mini-charts">
                      <div className="bg-gray-50 border border-gray-200 rounded p-3">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2 font-sans">风险偏好分布 (Risk Preference)</span>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={riskChartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9} allowDecimals={false} tickLine={false} />
                              <Tooltip />
                              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                {riskChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded p-3">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-2 font-sans">意向资金规模 (Capital Scale)</span>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={capitalChartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9} allowDecimals={false} tickLine={false} />
                              <Tooltip />
                              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                {capitalChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CDP Customer Table */}
                <div className="bg-white border border-gray-300 rounded overflow-hidden shadow-xs" id="cdp-customer-table">
                  <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">客群实时名单</h3>
                    <span className="text-[10px] text-gray-400 font-mono">
                      筛选: <strong className="text-blue-600 font-bold">{filteredStageUsers.length}</strong> / {selectedStageUsers.length} 人
                    </span>
                  </div>

                  {/* Filter Controls */}
                  <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs text-gray-700 space-y-3 font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                      {/* Search Query */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block font-sans">目标用户</label>
                        <input
                          type="text"
                          value={filterSearchQuery}
                          onChange={(e) => setFilterSearchQuery(e.target.value)}
                          placeholder="搜索姓名/邮箱/电话"
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 font-sans"
                        />
                      </div>

                      {/* Region Selector */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block font-sans">国家地区</label>
                        <select
                          value={filterRegion}
                          onChange={(e) => setFilterRegion(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
                        >
                          <option value="">全部国家/地区</option>
                          {Array.from(new Set(selectedStageUsers.map(u => u.region))).filter(Boolean).map(reg => (
                            <option key={reg} value={reg}>{reg}</option>
                          ))}
                        </select>
                      </div>

                      {/* Stay Days range */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block font-sans">停留天数区间</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="最少"
                            value={filterMinStayDays}
                            onChange={(e) => setFilterMinStayDays(e.target.value)}
                            className="w-1/2 bg-white border border-gray-300 rounded px-1 py-1 text-[11px] text-center focus:outline-none focus:border-blue-500 font-sans"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="最多"
                            value={filterMaxStayDays}
                            onChange={(e) => setFilterMaxStayDays(e.target.value)}
                            className="w-1/2 bg-white border border-gray-300 rounded px-1 py-1 text-[11px] text-center focus:outline-none focus:border-blue-500 font-sans"
                          />
                        </div>
                      </div>

                      {/* Silent Days range */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block font-sans">沉默天数区间</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="最少"
                            value={filterMinSilentDays}
                            onChange={(e) => setFilterMinSilentDays(e.target.value)}
                            className="w-1/2 bg-white border border-gray-300 rounded px-1 py-1 text-[11px] text-center focus:outline-none focus:border-blue-500 font-sans"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="最多"
                            value={filterMaxSilentDays}
                            onChange={(e) => setFilterMaxSilentDays(e.target.value)}
                            className="w-1/2 bg-white border border-gray-300 rounded px-1 py-1 text-[11px] text-center focus:outline-none focus:border-blue-500 font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                      {/* Risk Preference dropdown */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block font-sans">风险偏好</label>
                        <select
                          value={filterRiskPreference}
                          onChange={(e) => setFilterRiskPreference(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
                        >
                          <option value="">全部风险偏好</option>
                          <option value="保守">保守</option>
                          <option value="平衡">平衡</option>
                          <option value="激进">激进</option>
                        </select>
                      </div>

                      {/* Investment Experience dropdown */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block font-sans">投资经验</label>
                        <select
                          value={filterInvestmentExperience}
                          onChange={(e) => setFilterInvestmentExperience(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
                        >
                          <option value="">全部投资经验</option>
                          <option value="新手">新手</option>
                          <option value="有经验">有经验</option>
                        </select>
                      </div>

                      {/* Capital Scale dropdown */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase block font-sans">资金规模</label>
                        <select
                          value={filterCapitalScale}
                          onChange={(e) => setFilterCapitalScale(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
                        >
                          <option value="">全部资金规模</option>
                          <option value="小额">小额</option>
                          <option value="中额">中额</option>
                          <option value="大额">大额</option>
                        </select>
                      </div>

                      {/* Churn Risk and Reset Buttons */}
                      <div className="space-y-1 flex flex-col justify-end">
                        <div className="flex gap-1.5">
                          <div className="flex-1">
                            <select
                              value={filterChurnRisk}
                              onChange={(e) => setFilterChurnRisk(e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-blue-500 font-sans cursor-pointer"
                            >
                              <option value="">全部流失风险</option>
                              <option value="high">高风险</option>
                              <option value="normal">无风险</option>
                            </select>
                          </div>
                          {(filterSearchQuery || filterRegion || filterMinStayDays || filterMaxStayDays || filterMinSilentDays || filterMaxSilentDays || filterRiskPreference || filterInvestmentExperience || filterCapitalScale || filterChurnRisk) && (
                            <button
                              onClick={() => {
                                setFilterSearchQuery("");
                                setFilterRegion("");
                                setFilterMinStayDays("");
                                setFilterMaxStayDays("");
                                setFilterMinSilentDays("");
                                setFilterMaxSilentDays("");
                                setFilterRiskPreference("");
                                setFilterInvestmentExperience("");
                                setFilterCapitalScale("");
                                setFilterChurnRisk("");
                              }}
                              className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-bold transition shrink-0 cursor-pointer"
                            >
                              重置
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {filteredStageUsers.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center gap-1">
                        <Users className="w-8 h-8 text-gray-300" />
                        <p className="text-xs font-semibold">当前暂无匹配筛选条件的客户</p>
                        <p className="text-[10px] text-gray-400">请尝试清除或调整筛选参数</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase">
                            <th className="px-4 py-2.5">姓名</th>
                            <th className="px-4 py-2.5">国家地区</th>
                            <th className="px-4 py-2.5 text-center">停留天数</th>
                            <th className="px-4 py-2.5 text-center">沉默天数</th>
                            <th className="px-4 py-2.5">画像标签</th>
                            <th className="px-4 py-2.5 text-center">流失风险</th>
                            <th className="px-4 py-2.5">电子信箱</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredStageUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-4 py-2.5 font-bold text-gray-800">{user.name}</td>
                              <td className="px-4 py-2.5 font-mono text-gray-600">{user.region}</td>
                              <td className="px-4 py-2.5 text-center font-mono">{user.stayDays}d</td>
                              <td className="px-4 py-2.5 text-center font-mono">{user.lastActiveDays}d</td>
                              <td className="px-4 py-2.5">
                                <div className="flex flex-wrap gap-1">
                                  <span className="bg-blue-50 text-blue-700 text-[9px] px-1 py-0.2 rounded">{user.riskPreference}</span>
                                  <span className="bg-purple-50 text-purple-700 text-[9px] px-1 py-0.2 rounded">{user.investmentExperience}</span>
                                  <span className="bg-amber-50 text-amber-700 text-[9px] px-1 py-0.2 rounded">{user.capitalScale}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {user.churnRisk ? (
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded">高风险</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-gray-500 text-[11px]">{user.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI CAMPAIGN BUILDER */}
          {activeTab === "campaign-builder" && (
            <div className="grid grid-cols-12 gap-5 h-full overflow-hidden" id="tab-builder-container">
              
              {isGenerating && (
                <div className="col-span-12 h-full flex flex-col items-center justify-center bg-white border border-gray-300 rounded shadow-xs p-8 text-center" id="builder-loader">
                  <div className="relative mb-4">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <Bot className="w-5 h-5 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase">Gemini 3.5 营销策略引擎调用中</h3>
                  <p className="text-[11px] text-gray-400 max-w-sm mt-1 leading-relaxed">
                    正在分析客群的停留时长、沉默度、风险偏好及合规限制，匹配最优活动模型，并自动撰写高转化率的多渠道文案文法...
                  </p>
                </div>
              )}

              {!isGenerating && !generatedCampaign && (
                <div className="col-span-12 h-full flex flex-col items-center justify-center bg-white border border-gray-300 rounded shadow-xs p-12 text-center text-gray-500" id="builder-empty">
                  <Bot className="w-10 h-10 text-gray-300 mb-2" />
                  <h3 className="text-xs font-bold text-gray-700 uppercase">暂无生成中的活动策略</h3>
                  <p className="text-[11px] text-gray-400 max-w-xs mt-1">
                    请至左侧 CDP 菜单选择目标客群，并点击“AI 生成匹配方案”，或直接在 CDP 的详细大盘中启动。
                  </p>
                </div>
              )}

              {!isGenerating && generatedCampaign && (
                <>
                  {/* Left Half: Strategy Design & Parameters */}
                  <div className="col-span-6 flex flex-col gap-4 h-full overflow-y-auto bg-white border border-gray-300 p-5 rounded shadow-xs" id="builder-strategy-left">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                      <div>
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block font-sans">AI 策略匹配与自适应</span>
                        <h2 className="text-sm font-bold text-gray-900 mt-0.5">{generatedCampaign.strategyType}</h2>
                      </div>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                        {generatedCampaign.segment}
                      </span>
                    </div>

                    {/* Campaign Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block font-sans">活动营销名称</label>
                      <input
                        type="text"
                        value={generatedCampaign.name || ""}
                        onChange={(e) => setGeneratedCampaign({ ...generatedCampaign, name: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500 font-sans"
                      />
                    </div>

                    {/* Dynamic parameters depending on type */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block font-sans">转换观察期 (天)</label>
                        <input
                          type="number"
                          value={generatedCampaign.windowDays || 7}
                          onChange={(e) => setGeneratedCampaign({ ...generatedCampaign, windowDays: parseInt(e.target.value) || 7 })}
                          className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:bg-white"
                        />
                      </div>

                      {generatedCampaign.parameters?.bonusPct !== undefined && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block font-sans">首充赠金比例 (%)</label>
                          <input
                            type="number"
                            value={generatedCampaign.parameters.bonusPct}
                            onChange={(e) => setGeneratedCampaign({
                              ...generatedCampaign,
                              parameters: { ...generatedCampaign.parameters, bonusPct: parseInt(e.target.value) || 0 }
                            })}
                            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:bg-white"
                          />
                        </div>
                      )}

                      {generatedCampaign.parameters?.courseTitle !== undefined && (
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block font-sans">学员赠送课程</label>
                          <input
                            type="text"
                            value={generatedCampaign.parameters.courseTitle}
                            onChange={(e) => setGeneratedCampaign({
                              ...generatedCampaign,
                              parameters: { ...generatedCampaign.parameters, courseTitle: e.target.value }
                            })}
                            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:bg-white"
                          />
                        </div>
                      )}

                      {generatedCampaign.parameters?.durationHours !== undefined && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block font-sans">紧迫感时效限制 (小时)</label>
                          <input
                            type="number"
                            value={generatedCampaign.parameters.durationHours}
                            onChange={(e) => setGeneratedCampaign({
                              ...generatedCampaign,
                              parameters: { ...generatedCampaign.parameters, durationHours: parseInt(e.target.value) || 24 }
                            })}
                            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:bg-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* AI Logic Analysis Detail */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block font-sans">AI 决策与文案背景分析</label>
                      <div className="prose prose-slate max-w-none text-xs bg-gray-50 border border-gray-200 p-3.5 rounded h-40 overflow-y-auto leading-relaxed font-sans">
                        <ReactMarkdown>{generatedCampaign.detailsMarkdown || ""}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Channel selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block font-sans">启用发送触达渠道</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { id: "email", name: "✉️ Email 邮件通知", active: true },
                          { id: "sms", name: "💬 SMS 行动短信", active: true },
                          { id: "push", name: "🔔 App Push 系统推送", active: true },
                          { id: "whatsapp", name: "📱 WhatsApp 社群群发", active: true }
                        ].map((ch) => {
                          const isChecked = selectedChannels.includes(ch.id as any);
                          return (
                            <label
                              key={ch.id}
                              className={`flex items-center gap-2 px-3 py-2 border rounded cursor-pointer transition ${
                                isChecked
                                  ? "bg-blue-50/50 border-blue-300 text-blue-900"
                                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedChannels(selectedChannels.filter(c => c !== ch.id));
                                  } else {
                                    setSelectedChannels([...selectedChannels, ch.id as any]);
                                  }
                                }}
                                className="accent-blue-600 h-3.5 w-3.5"
                              />
                              <span className="text-[11px] font-medium">{ch.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Half: Live Text Copy Editor & Trigger Send */}
                  <div className="col-span-6 flex flex-col gap-4 h-full overflow-y-auto bg-white border border-gray-300 p-5 rounded shadow-xs" id="builder-strategy-right">
                    
                    {/* Language & Tabs row */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 flex-wrap gap-2 shrink-0">
                      <div className="flex gap-1">
                        {["email", "sms", "push", "whatsapp"].map((ch) => (
                          <button
                            key={ch}
                            onClick={() => setCopyTab(ch as any)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded uppercase transition cursor-pointer ${
                              copyTab === ch
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            {ch === "email" && "Email"}
                            {ch === "sms" && "SMS"}
                            {ch === "push" && "Push"}
                            {ch === "whatsapp" && "WhatsApp"}
                          </button>
                        ))}
                      </div>

                      {/* Language selection pills */}
                      <div className="bg-gray-100 p-0.5 rounded flex items-center">
                        <button
                          onClick={() => setSelectedLanguage("zh")}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                            selectedLanguage === "zh"
                              ? "bg-white text-gray-800 shadow-xs"
                              : "text-gray-500"
                          }`}
                        >
                          简体
                        </button>
                        <button
                          onClick={() => setSelectedLanguage("en")}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                            selectedLanguage === "en"
                              ? "bg-white text-gray-800 shadow-xs"
                              : "text-gray-500"
                          }`}
                        >
                          EN
                        </button>
                      </div>
                    </div>

                    {/* Text area for copy body */}
                    <div className="flex-1 flex flex-col gap-1 min-h-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase font-sans">
                          渠道文案主体 (双语对齐)
                        </span>
                        {copyTab === "email" && (
                          <span className="text-[9px] bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.2 rounded font-mono">
                            自动附加引导 Telegram 链接
                          </span>
                        )}
                      </div>

                      <textarea
                        rows={16}
                        value={generatedCampaign.copies?.[copyTab]?.[selectedLanguage] || ""}
                        onChange={(e) => {
                          if (!generatedCampaign.copies) return;
                          const updatedCopies = { ...generatedCampaign.copies };
                          updatedCopies[copyTab] = {
                            ...updatedCopies[copyTab],
                            [selectedLanguage]: e.target.value
                          };
                          setGeneratedCampaign({ ...generatedCampaign, copies: updatedCopies });
                        }}
                        className="w-full flex-1 bg-gray-50 border border-gray-200 rounded p-3 font-mono text-xs leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <button
                      onClick={handleLaunchCampaign}
                      disabled={selectedChannels.length === 0}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 uppercase tracking-wider"
                      id="btn-launch-campaign"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>确认无误 • 启动多渠道自动投放</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: SANDBOX MONITOR & SIMULATION */}
          {activeTab === "monitor" && (
            <div className="grid grid-cols-12 gap-5 h-full overflow-hidden" id="tab-monitor-container">
              
              {/* Left Column: Active campaigns listing */}
              <div className="col-span-8 flex flex-col gap-4 h-full overflow-y-auto bg-white border border-gray-300 p-5 rounded shadow-xs" id="monitor-active-campaigns">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 shrink-0">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">自动营销投放实时大盘 (CDP 反馈)</h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">显示目前正在沙盒中运行或已到期的行销活动</p>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {campaigns.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-1">
                      <Target className="w-8 h-8 text-gray-300" />
                      <p className="text-xs font-semibold">当前暂无任何投放活动</p>
                      <p className="text-[10px] text-gray-400">请前往「CDP 客户分群」或「AI 策略与文案」新建一个活动</p>
                    </div>
                  ) : (
                    campaigns.map((camp) => {
                      const isActive = camp.status === "active";
                      const isCompleted = camp.status === "completed";
                      
                      return (
                        <div key={camp.id} className="border border-gray-200 rounded p-4 bg-gray-50/40 hover:bg-white transition-all shadow-2xs" id={`campaign-monitor-${camp.id}`}>
                          <div className="flex items-start justify-between flex-wrap gap-2 pb-2.5 border-b border-gray-100">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-gray-800">{camp.name}</h4>
                                <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 rounded font-mono font-bold">
                                  ID: {camp.id}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                目标分群: <strong className="text-gray-600">{camp.segment}</strong> • 
                                观察窗口: <strong className="text-gray-600">{camp.windowDays}天</strong>
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {isActive && (
                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 animate-pulse">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                  正在观测
                                </span>
                              )}
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                                  观测已结束
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Detail Metric Matrix */}
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            {/* Touch Delivery list */}
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block font-sans">渠道触达与质量反馈</span>
                              <div className="space-y-1">
                                {camp.channels.map(ch => {
                                  const metric = camp.touchMetrics?.[ch];
                                  return (
                                    <div key={ch} className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-gray-200 text-[11px]">
                                      <span className="font-semibold text-gray-500 uppercase text-[9px]">{ch}</span>
                                      <div className="font-mono text-[10px] flex items-center gap-2 text-gray-600">
                                        <span>送达: {metric?.sent || camp.targetsCount}</span>
                                        {metric && "opened" in metric && (
                                          <span className="text-blue-600 font-bold">
                                            开启: {metric.opened} ({Math.round((metric.opened / Math.max(1, metric.sent)) * 100)}%)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Conversion block */}
                            <div className="bg-white border border-gray-200 p-3 rounded flex flex-col justify-between">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-sans">
                                  CDP 回写 FTD/FTT 转化
                                </span>
                                <span className="font-mono text-[10px] font-bold text-blue-600">
                                  {camp.convertedCount} / {camp.targetsCount} 人
                                </span>
                              </div>

                              <div className="mt-2">
                                <div className="flex items-baseline justify-between">
                                  <h3 className="text-xl font-black text-gray-800 font-mono leading-none">
                                    {camp.conversionRate}%
                                  </h3>
                                  <span className="text-[9px] text-gray-400 font-sans">目标激活率</span>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                                  <div
                                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${camp.conversionRate}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Time advance machine and logs */}
              <div className="col-span-4 flex flex-col gap-4 h-full overflow-hidden" id="monitor-simulation-panel">
                
                {/* Time Advance machine - styled as High-Contrast Premium Card */}
                <div className="bg-[#1E293B] border border-slate-700 p-4 rounded text-white flex flex-col justify-between shrink-0 shadow-md" id="simulation-travel-box">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "12s" }} />
                    <span className="text-xs font-bold font-sans tracking-wide">时空旅行沙盒模拟器</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-2.5">
                    快速推进营销时间。观察活动到期、转化率计算、触发真实概率转换引擎，由 KYC 通过无缝前进至 FTD 首充/交易。
                  </p>

                  <div className="bg-slate-800 rounded p-2.5 border border-slate-700 flex items-center justify-between mt-3">
                    <span className="text-[10px] text-slate-300">时间前进跨度</span>
                    <div className="flex gap-1">
                      {[1, 3, 7].map((d) => (
                        <button
                          key={d}
                          onClick={() => setSimDaysToAdvance(d)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                            simDaysToAdvance === d
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {d} 天
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdvanceTime(simDaysToAdvance)}
                    disabled={isSimulating}
                    className="w-full mt-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-black text-xs rounded transition flex items-center justify-center gap-1 cursor-pointer"
                    id="btn-simulate-time"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>时光穿梭 + {simDaysToAdvance} 天</span>
                  </button>
                </div>

                {/* Sandbox Log lists */}
                <div className="bg-white border border-gray-300 p-4 rounded flex-1 flex flex-col overflow-hidden shadow-xs" id="simulation-logs-card">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase font-sans">沙盒数据流转实时日志</span>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                  </div>

                  <div className="flex-1 overflow-y-auto font-mono text-[10px] text-gray-700 space-y-2 mt-2 pr-1" id="simulation-logs-scroller">
                    {simulationLogs.map((log, idx) => (
                      <div key={idx} className="p-2 rounded bg-gray-50 border border-gray-200 leading-relaxed">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLOSED-LOOP AI OPTIMIZATION */}
          {activeTab === "optimization" && (
            <div className="grid grid-cols-12 gap-5 h-full overflow-hidden" id="tab-optimization-container">
              
              {/* Left Column: Pending Optimization recommendations */}
              <div className="col-span-8 flex flex-col gap-4 h-full overflow-y-auto bg-white border border-gray-300 p-5 rounded shadow-xs" id="optimization-suggestions">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 shrink-0">
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">待审批自适应优化建议</h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">营销窗口期结束后，由 AI 自动归因数据差额并生成调整方案</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                    人工审核
                  </span>
                </div>

                <div className="space-y-5">
                  {campaigns.filter(c => c.optimizationStatus === "pending").length === 0 ? (
                    <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-1.5">
                      <TrendingUp className="w-8 h-8 text-gray-300 animate-pulse" />
                      <p className="text-xs font-semibold">当前暂无待处理的优化反馈</p>
                      <p className="text-[10px] text-gray-400 max-w-sm">
                        当有营销活动投放观察期结束，系统会全自动触发归因模型，并调用 AI 提供反思改进规则。可在模拟器中快速推进时间。
                      </p>
                    </div>
                  ) : (
                    campaigns.filter(c => c.optimizationStatus === "pending").map((camp) => (
                      <div key={camp.id} className="border border-amber-200 rounded p-4 bg-amber-50/10 space-y-3.5" id={`pending-opt-${camp.id}`}>
                        <div className="pb-2 border-b border-gray-100">
                          <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded uppercase">
                            转化不达预期 • 自动触发归因
                          </span>
                          <h4 className="text-xs font-bold text-gray-800 mt-1">来源活动: {camp.name} ({camp.id})</h4>
                          <p className="text-[10px] text-gray-400">
                            目标群体: {camp.segment} • 实际转化率: <strong className="text-red-600">{camp.conversionRate}%</strong>
                          </p>
                        </div>

                        <div className="space-y-3 text-xs leading-relaxed font-sans">
                          <div className="space-y-0.5">
                            <span className="font-bold text-gray-400 text-[9px] uppercase">归因诊断 (Rationale)</span>
                            <p className="text-gray-700 bg-white p-3 rounded border border-gray-200">{camp.optimizationSuggestion?.rationale}</p>
                          </div>

                          <div className="p-3 bg-blue-50/50 rounded border border-blue-100">
                            <span className="font-bold text-blue-700 text-[9px] uppercase block">下一轮规则策略变更建议 (Proposed Rule)</span>
                            <p className="font-bold text-blue-900 text-xs mt-0.5">
                              {camp.optimizationSuggestion?.proposedChange}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end pt-2">
                          <button
                            onClick={() => handleRejectRule(camp.id)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded border border-gray-300 transition cursor-pointer"
                          >
                            驳回反馈
                          </button>
                          <button
                            onClick={() => handleApproveRule(camp.id)}
                            className="flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-xs transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>通过并融入策略模型</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Active constraints / rules lists */}
              <div className="col-span-4 flex flex-col gap-4 h-full overflow-y-auto bg-white border border-gray-300 p-5 rounded shadow-xs" id="optimization-rules">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3 shrink-0">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">自适应硬性先验规则</h3>
                </div>

                <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                  以下展示经人工确认通过的底层自适应规则。AI 生成新一轮活动及文案时，将强制遵守这些规则作为硬性 Prompt 先验约束，保障闭环演进。
                </p>

                <div className="space-y-3.5">
                  {rules.adjustments.map((adj) => (
                    <div key={adj.id} className="p-3 rounded bg-gray-50 border border-gray-200 space-y-1.5" id={`rule-${adj.id}`}>
                      <div className="flex items-center justify-between text-[9px] font-sans">
                        <span className="bg-gray-200 text-gray-700 px-1.5 rounded font-mono font-bold">
                          {adj.stage}
                        </span>
                        <span className="text-gray-400 font-mono">
                          {new Date(adj.approvedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800">
                        {adj.proposedChange}
                      </p>
                      <div className="text-[9px] text-gray-500 leading-relaxed border-t border-gray-100 pt-1.5">
                        <strong>归因细节:</strong> {adj.rationale}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FOOTER STATUS BAR */}
      <footer className="h-6 bg-gray-800 text-gray-400 px-4 flex items-center justify-between text-[9px] shrink-0 font-mono z-10" id="app-footer">
        <div className="flex gap-4">
          <span>CDP 数据同步状态: <span className="text-green-500 uppercase font-bold">Stable</span></span>
          <span>最后同步: 2026-07-16 14:02:15</span>
        </div>
        <div className="flex gap-4">
          <span>运行节点: Global-Cluster-02</span>
          <span>授权密钥: 0x82...A2B</span>
        </div>
      </footer>
    </div>
  );
}
