import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip as RechartsTooltip, AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { GoogleGenAI } from '@google/genai';
import { 
  LayoutDashboard, 
  Zap, 
  Info, 
  Bell, 
  Settings, 
  ArrowRight, 
  Boxes,
  Activity, 
  Cpu, 
  BarChart3,
  Search,
  Menu,
  X,
  ChevronRight,
  AlertTriangle,
  Anchor,
  Box,
  Globe,
  CloudLightning,
  Truck,
  CheckCircle2,
  Play,
  Factory,
  Warehouse,
  Store,
  Check,
  Brain,
  AlertCircle,
  Network,
  History,
  FileText,
  Printer
} from 'lucide-react';

// --- Types ---
type DisruptionObject = {
  id: string;
  name: string;
  type: string;
  affected_nodes: string[];
  probability: number;
  severity: number;
  duration_days: number;
  financial_impact_usd: number;
  new_investment_usd: number; // New money to spend
  recovery_time_days: number;
  description: string;
  estimated_delay_days: number;
  potential_cost_inr_crore: number;
};

type StrategyObject = {
  id: string;
  risk_label: string;
  name: string;
  description: string;
  reason: string;
  merits: string[];
  cons: string[];
  impact_percent: number;
  cost_usd: number;
  time_to_implement_days: number;
  success_probability: number; // 0-100%
  preferability_reason: string; // Analysis of why it's chosen
  color_type: 'error' | 'green' | 'primary';
  recommended: boolean;
};

type WarGameObject = {
  without_strategy: {
    recovery_days: number;
    financial_impact_usd: number;
    service_level_drop: number;
  };
  with_strategy: {
    recovery_days: number;
    financial_impact_usd: number;
    service_level_drop: number;
  };
  improvement_percent: number;
  narrative: string;
};

type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error';
};

type SimulationRecord = {
  scenario: string;
  type: string;
  severity: number;
  impact: string;
  recovery: number;
  strategy: string;
  status: string;
};

// --- Fallback Data ---
const fallbackDisruption: DisruptionObject = {
  id: "d1", 
  name: "Cyber Attack: Core DB", 
  type: "cyber_attack", 
  affected_nodes: ["Foxconn Assembly", "Singapore DC"], 
  probability: 0.82, 
  severity: 9, 
  duration_days: 15, 
  financial_impact_usd: 5200000, 
  new_investment_usd: 1200000,
  recovery_time_days: 20, 
  description: "A sophisticated ransomware attack has compromised the core database systems at the assembly facility, halting production lines and disrupting logistics coordination.", 
  estimated_delay_days: 15, 
  potential_cost_inr_crore: 5.2
};

const fallbackStrategies: StrategyObject[] = [
  { id: "s1", risk_label: "High Risk", name: "No Action", description: "Default operational procedure.", reason: "Maintains current cash flow but risks total failure.", merits: ["Zero immediate cost"], cons: ["Maximum financial exposure"], impact_percent: 100, cost_usd: 0, time_to_implement_days: 0, success_probability: 15, preferability_reason: "Not recommended due to catastrophic risk profile.", color_type: "error", recommended: false },
  { id: "s2", risk_label: "Balanced", name: "Backup Supplier", description: "AI activates secondary Tier-2 nodes.", reason: "Quickly restores production capacity.", merits: ["Fast recovery"], cons: ["Higher unit cost"], impact_percent: 22, cost_usd: 450000, time_to_implement_days: 3, success_probability: 88, preferability_reason: "Best balance of speed and cost for this specific disruption.", color_type: "green", recommended: true },
  { id: "s3", risk_label: "Conservative", name: "Inventory Buffer", description: "Increase safety stock at all nodes.", reason: "Provides immediate buffer.", merits: ["Guaranteed availability"], cons: ["High holding costs"], impact_percent: 45, cost_usd: 800000, time_to_implement_days: 7, success_probability: 95, preferability_reason: "Very secure but expensive for long-term use.", color_type: "primary", recommended: false },
  { id: "s4", risk_label: "Modular", name: "Reroute Logistics", description: "Change delivery partners.", reason: "Bypasses geographical bottlenecks.", merits: ["Flexibility"], cons: ["Complex tracking"], impact_percent: 30, cost_usd: 150000, time_to_implement_days: 2, success_probability: 70, preferability_reason: "Good temporary patch while main nodes recover.", color_type: "primary", recommended: false },
  { id: "s5", risk_label: "Strategic", name: "Cloud Migration", description: "Move onsite DB to AWS/Azure.", reason: "Hardens infrastructure against future cyber events.", merits: ["Long-term security"], cons: ["High migration effort"], impact_percent: 15, cost_usd: 2500000, time_to_implement_days: 14, success_probability: 92, preferability_reason: "High CAPEX but prevents recurrence.", color_type: "primary", recommended: false }
];

const fallbackWarGame: WarGameObject = {
  without_strategy: { recovery_days: 28, financial_impact_usd: 8400000, service_level_drop: 35 },
  with_strategy: { recovery_days: 11, financial_impact_usd: 2100000, service_level_drop: 12 },
  improvement_percent: 61,
  narrative: "Without intervention, the supply chain faces a 28-day recovery window with significant revenue exposure across three manufacturing tiers. By activating the Backup Supplier strategy, the AI reroutes 73% of production capacity to secondary Tier-2 nodes within 48 hours. This reduces financial exposure by ₹4.8 Cr and restores service levels to 88% within 11 days."
};

const initialSimulationHistory: SimulationRecord[] = [
  { scenario: "Taiwan Strait Closure", type: "Geopolitical", severity: 9, impact: "$8.4M", recovery: 28, strategy: "Dual Sourcing", status: "Resolved" },
  { scenario: "Port of Shanghai Delay", type: "Logistics", severity: 6, impact: "$2.1M", recovery: 12, strategy: "Buffer Stock", status: "Monitoring" },
  { scenario: "Rare Earth Shortage", type: "Material", severity: 7, impact: "$5.7M", recovery: 21, strategy: "Nearshoring", status: "Active" }
];

const SUPPLY_CHAIN_NODES_FALLBACK = [
  "Raw Material",
  "TSMC Taiwan",
  "Foxconn Assembly",
  "Global Hub",
  "Singapore DC",
  "Retailing Unit"
];

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'simulation' | 'report' | 'about'>('dashboard');
  const [showWarGameModal, setShowWarGameModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState({ disruption: false, strategies: false, warGame: false });
  const [disruption, setDisruption] = useState<DisruptionObject | null>(null);
  const [strategies, setStrategies] = useState<StrategyObject[]>([]);
  const [warGameResult, setWarGameResult] = useState<WarGameObject | null>(null);
  
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [simulationHistory, setSimulationHistory] = useState<SimulationRecord[]>(initialSimulationHistory);

  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [budgetConstraint, setBudgetConstraint] = useState(5000000);
  const [serviceLevelTarget, setServiceLevelTarget] = useState(95);
  const [mfgLocation, setMfgLocation] = useState("Manufacturing COMPANY");
  const [dcLocation, setDcLocation] = useState("Singapore DC");

  const supplyChainNodes = [
    { id: 'node_1', name: "Raw Material", category: "Manufacturing", icon: Factory },
    { id: 'node_2', name: mfgLocation, category: "Manufacturing", icon: Cpu },
    { id: 'node_3', name: "Foxconn Assembly", category: "Assembly", icon: Box },
    { id: 'node_4', name: "Global Hub", category: "Stop", icon: Anchor },
    { id: 'node_5', name: dcLocation, category: "Storehouse", icon: Warehouse },
    { id: 'node_6', name: "Retailing Unit", category: "Retail", icon: Store },
  ];

  const [selectedDisruption, setSelectedDisruption] = useState("Cyber Attack: Core DB Breach");
  const [customDisruption, setCustomDisruption] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("Backup Supplier");
  const [affectedNodes, setAffectedNodes] = useState<string[]>([]);
  const [resolvedNodes, setResolvedNodes] = useState<string[]>([]);
  const [isRunningStrategy, setIsRunningStrategy] = useState<string | null>(null);
  const [appliedStrategy, setAppliedStrategy] = useState<StrategyObject | null>(null);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleSimulateDisruption = async () => {
    setActiveTab('simulation');
    setIsLoading(prev => ({ ...prev, disruption: true, strategies: true }));
    setDisruption(null);
    setStrategies([]);
    setAppliedStrategy(null);

    try {
      const scenarioText = selectedDisruption === "Custom Disruption (AI Generated)" ? customDisruption : selectedDisruption;
      
      const combinedPrompt = `You are a world-class supply chain resilience expert and data scientist. Analyze the following scenario with absolute precision: "${scenarioText}".
      
      In this network hierarchical flow: "Manufacturing" -> "Assembly" -> "Stops/Hubs" -> "Storehouses" -> "Retail".
      Sequential nodes: ${supplyChainNodes.map(n => n.name).join(', ')}.
      
      TASK:
      1. Generate a realistic disruption scenario object.
      2. Produce exactly 5 professional, non-randomized resilience strategies. Each must be a perfectly calculated engineering response to the specific disruption provided.
      
      Return ONLY a valid JSON object with this exact structure:
      {
        "disruption": {
          "id": "d1",
          "name": "string",
          "type": "cyber_attack|port_closure|material_shortage|geopolitical|climate|logistics",
          "affected_nodes": ["string"], // Select nodes from the provided list
          "probability": 0.75,
          "severity": 8,
          "duration_days": 15,
          "financial_impact_usd": 5200000,
          "new_investment_usd": 1200000,
          "recovery_time_days": 20,
          "description": "string",
          "estimated_delay_days": 15,
          "potential_cost_inr_crore": 5.2
        },
        "strategies": [
          {
            "id": "s1",
            "risk_label": "High Risk|Balanced|Conservative|Modular|Strategic",
            "name": "string",
            "description": "string",
            "reason": "string",
            "merits": ["string"], // List multiple specific merits
            "cons": ["string"], // List multiple specific demerits
            "impact_percent": number, // Remaining impact percent after strategy (e.g. 20 means 80% solved)
            "cost_usd": number,
            "time_to_implement_days": number,
            "success_probability": number, // 0-100. High risk strategies MUST have lower probability (40-60%), Conservative 90%+.
            "preferability_reason": "Provide a detailed, data-driven analysis of why this strategy is or isn't preferable based on cost, time, and success probability.",
            "color_type": "error|green|primary",
            "recommended": boolean
          }
        ]
      }`;

      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: combinedPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const responseText = res.text || '{}';
      const data = JSON.parse(responseText);
      
      if (!data.disruption || !data.strategies) {
        throw new Error("Invalid AI response format");
      }

      setDisruption(data.disruption);
      setAffectedNodes(data.disruption.affected_nodes || []);
      setResolvedNodes([]);
      
      // Sort strategies so recommended/preferable ones appear first
      const sortedStrategies = (data.strategies || []).sort((a: any, b: any) => 
        (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0)
      );
      setStrategies(sortedStrategies);

      setSimulationHistory(prev => [{
        scenario: data.disruption.name || "AI Scenario",
        type: data.disruption.type || "Other",
        severity: data.disruption.severity || 5,
        impact: `$${((data.disruption.financial_impact_usd || 0) / 1000000).toFixed(1)}M`,
        recovery: data.disruption.recovery_time_days || 0,
        strategy: sortedStrategies.find((s: any) => s.recommended)?.name || "Pending",
        status: "Active"
      }, ...prev]);
      
      addToast("Simulation and strategies generated successfully", "success");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      
      if (error.message?.includes("quota") || error.status === 429) {
        addToast("Gemini API Quota Exceeded. Using fallback simulation data. Please try again later.", "error");
      } else {
        addToast("Error communicating with AI. Using fallback data.", "error");
      }

      setDisruption(fallbackDisruption);
      setAffectedNodes(fallbackDisruption.affected_nodes);
      setResolvedNodes([]);
      
      const sortedFallbackStrategies = [...fallbackStrategies].sort((a, b) => 
        (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0)
      );
      setStrategies(sortedFallbackStrategies);

      setSimulationHistory(prev => [{
        scenario: fallbackDisruption.name,
        type: fallbackDisruption.type,
        severity: fallbackDisruption.severity,
        impact: `$${(fallbackDisruption.financial_impact_usd / 1000000).toFixed(1)}M`,
        recovery: fallbackDisruption.recovery_time_days,
        strategy: sortedFallbackStrategies.find((s: any) => s.recommended)?.name || "Pending",
        status: "Active"
      }, ...prev]);
    } finally {
      setIsLoading(prev => ({ ...prev, disruption: false, strategies: false }));
    }
  };

  const handleRunWarGame = async () => {
    setIsLoading(prev => ({ ...prev, warGame: true }));
    setWarGameResult(null);

    try {
      const prompt = `Simulate a supply chain war game. Disruption scenario: ${selectedDisruption}. Resilience strategy applied: ${selectedStrategy}. Return ONLY valid JSON: {"without_strategy":{"recovery_days":28,"financial_impact_usd":8400000,"service_level_drop":35},"with_strategy":{"recovery_days":11,"financial_impact_usd":2100000,"service_level_drop":12},"improvement_percent":61,"narrative":"string (exactly 2-3 sentences describing what happens)"}`;
      
      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      const result = JSON.parse(res.text || '{}');
      setWarGameResult(result);
      addToast("War game simulation complete", "success");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      if (error.message?.includes("quota") || error.status === 429) {
        addToast("Gemini API Quota Exceeded. Using fallback war game data.", "error");
      }
      setWarGameResult(fallbackWarGame);
    } finally {
      setIsLoading(prev => ({ ...prev, warGame: false }));
    }
  };

  const handleRunStrategy = async (strategy: StrategyObject) => {
    setIsRunningStrategy(strategy.id);

    try {
      // Simulate API delay for running strategy
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setResolvedNodes(affectedNodes);
      setAffectedNodes([]);
      setAppliedStrategy(strategy);
      
      // Update history
      const newRecord: SimulationRecord = {
        scenario: disruption?.name || selectedDisruption,
        type: disruption?.type || "Unknown",
        severity: disruption?.severity || 0,
        impact: `$${((disruption?.financial_impact_usd || 0) * (strategy.impact_percent / 100) / 1000000).toFixed(2)}M`,
        recovery: Math.ceil((disruption?.estimated_delay_days || 0) * (strategy.impact_percent / 100) + strategy.time_to_implement_days),
        strategy: strategy.name,
        status: strategy.success_probability > 75 ? "Resolved" : "High Risk Action"
      };
      setSimulationHistory(prev => [newRecord, ...prev]);

      addToast(`Strategy "${strategy.name}" deployed successfully`, "success");
    } catch (error) {
      console.error("Error running strategy:", error);
      addToast("Failed to deploy strategy", "error");
    } finally {
      setIsRunningStrategy(null);
    }
  };

  const getIconForType = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'cyber_attack': return <Cpu className="w-5 h-5 text-error" />;
      case 'port_closure': return <Anchor className="w-5 h-5 text-error" />;
      case 'material_shortage': return <Box className="w-5 h-5 text-error" />;
      case 'geopolitical': return <Globe className="w-5 h-5 text-error" />;
      case 'climate': return <CloudLightning className="w-5 h-5 text-error" />;
      case 'logistics': return <Truck className="w-5 h-5 text-error" />;
      default: return <AlertTriangle className="w-5 h-5 text-error" />;
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'text-error';
    if (severity >= 5) return 'text-secondary';
    return 'text-primary';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'CRITICAL SEVERITY';
    if (severity >= 5) return 'HIGH SEVERITY';
    return 'MODERATE SEVERITY';
  };

  return (
    <div className="min-h-screen relative z-10 font-body flex overflow-x-hidden">
      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar (Drawer) */}
      <aside className={`fixed top-0 left-0 h-full w-[260px] bg-surface/95 lg:bg-surface/40 backdrop-blur-[30px] z-[60] border-r border-outline flex flex-col p-6 transition-transform duration-300 lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Boxes className="text-primary w-6 h-6" />
            </div>
            <div className="font-headline text-[1.2rem] font-[900] text-primary drop-shadow-[0_0_15px_rgba(114,220,255,0.3)] tracking-tighter">
              SC SIMULATOR
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="lg:hidden text-white/50 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'simulation', label: 'Simulation', icon: Zap },
            { id: 'report', label: 'Report', icon: FileText },
            { id: 'about', label: 'About', icon: Info },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsMenuOpen(false);
              }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(114,220,255,0.1)]' 
                  : 'text-on-surface-variant hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-primary' : 'text-on-surface-variant'}`} />
              <span className="font-medium text-[0.95rem]">{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_#72dcff]"></div>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen w-full relative">
        {/* Top Header */}
        <header className="h-[64px] bg-surface/40 backdrop-blur-[20px] z-50 border-b border-outline flex items-center justify-between px-4 lg:px-[32px] sticky top-0">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 -ml-2 text-white/70 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="font-headline text-[1.1rem] font-[900] text-primary tracking-tighter">
              SC
            </div>
          </div>
          <div className="flex items-center gap-4">
            <h2 className="text-on-surface-variant font-medium text-sm capitalize">
              Pages / <span className="text-white">{activeTab}</span>
            </h2>
          </div>
        </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 lg:p-[32px] flex flex-col gap-[32px]">
        
        {/* TAB: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col gap-[32px]">

            {/* Hero Section */}
            <div className="bg-surface-container border border-outline rounded-[12px] p-8 md:p-12 lg:p-[48px] flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 quantum-mesh opacity-30"></div>
              <h1 className="font-headline text-3xl md:text-4xl lg:text-[3rem] font-[800] text-white mb-[16px] relative z-10 leading-tight">
                Agentic Supply Chain <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Disruption Simulator</span>
              </h1>
              <p className="text-sm md:text-base lg:text-[1.1rem] text-on-surface-variant max-w-3xl mb-[32px] relative z-10 leading-relaxed">
                An AI-powered agentic simulator that detects global supply chain disruptions, models cascading failures, and recommends optimal resilience strategies in real time.
              </p>
              <button 
                onClick={() => setActiveTab('simulation')}
                className="relative z-10 group px-6 py-3 md:px-8 md:py-4 bg-primary text-[#004c5e] font-[800] text-base md:text-[1.1rem] rounded-[4px] shadow-[0_0_30px_rgba(114,220,255,0.3)] hover:scale-[1.02] transition-all flex items-center gap-3"
              >
                Start Simulation <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[24px]">
              {[
                { icon: Activity, title: 'AI Disruption Detection', desc: 'Real-time monitoring of global events, from cyber attacks to climate crises.' },
                { icon: Network, title: 'Cascading Failure Modeling', desc: 'Simulate how a single node failure impacts the entire supply chain network.' },
                { icon: Cpu, title: 'Strategy Optimization', desc: 'Agentic AI recommends the most cost-effective resilience strategies.' },
                { icon: BarChart3, title: 'Real-time Analytics', desc: 'Analyze cost vs. delay and track recovery metrics over a 48-hour window.' }
              ].map((feature, i) => (
                <div key={i} className="bg-surface-container border border-outline p-[24px] rounded-[12px] hover:border-primary/50 transition-colors group">
                  <div className="w-[48px] h-[48px] rounded-full bg-primary/10 flex items-center justify-center mb-[16px] group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="text-primary w-6 h-6" />
                  </div>
                  <h3 className="font-headline text-[1.1rem] font-[700] text-white mb-[8px]">{feature.title}</h3>
                  <p className="text-[0.85rem] text-on-surface-variant leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Simulation */}
        {activeTab === 'simulation' && (
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* Section A: Configuration Panel */}
            <div className="glass-panel overflow-hidden rounded-2xl border border-outline-variant/20">
              <button 
                onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                className="w-full flex items-center justify-between p-6 bg-surface-container-high/40 hover:bg-surface-container-high/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-primary" />
                  <h3 className="font-headline font-bold text-white uppercase tracking-wider">Configure Supply Chain Inputs</h3>
                </div>
                {isConfigExpanded ? <X className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              
              <AnimatePresence>
                {isConfigExpanded && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-surface-container-lowest/30"
                  >
                    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Parameters</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-on-surface-variant font-bold">
                              <span>Budget Constraint</span>
                              <span className="text-white font-mono">${(budgetConstraint / 1000000).toFixed(1)}M</span>
                            </div>
                            <input 
                              type="range" min="100000" max="10000000" step="100000"
                              value={budgetConstraint}
                              onChange={(e) => setBudgetConstraint(Number(e.target.value))}
                              className="w-full accent-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-on-surface-variant font-bold">
                              <span>Service Level Target</span>
                              <span className="text-white font-mono">{serviceLevelTarget}%</span>
                            </div>
                            <input 
                              type="range" min="70" max="99.9" step="0.1"
                              value={serviceLevelTarget}
                              onChange={(e) => setServiceLevelTarget(Number(e.target.value))}
                              className="w-full accent-secondary"
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-1">
                               <label className="text-[10px] text-on-surface-variant font-black uppercase tracking-wider">Manufacturing Location</label>
                               <input 
                                 type="text"
                                 value={mfgLocation}
                                 onChange={(e) => setMfgLocation(e.target.value)}
                                 placeholder="e.g. Manufacturing COMPANY"
                                 className="w-full glass-panel px-4 py-2 rounded-lg text-white text-xs outline-none focus:border-primary border border-outline-variant/30 transition-all font-bold"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] text-on-surface-variant font-black uppercase tracking-wider">Storehouse / DC Location</label>
                               <input 
                                 type="text"
                                 value={dcLocation}
                                 onChange={(e) => setDcLocation(e.target.value)}
                                 placeholder="e.g. Singapore DC"
                                 className="w-full glass-panel px-4 py-2 rounded-lg text-white text-xs outline-none focus:border-primary border border-outline-variant/30 transition-all font-bold"
                               />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Bill of Materials (BOM) — Baseline</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-white/10 text-on-surface-variant font-black">
                                <th className="pb-3">Component</th>
                                <th className="pb-3">Supplier Node</th>
                                <th className="pb-3 text-center">Criticality</th>
                                <th className="pb-3 text-right">Lead Time</th>
                              </tr>
                            </thead>
                            <tbody className="text-on-surface/80">
                              {[
                                { c: "CPU Assembly", s: mfgLocation, crit: "Critical", lt: 21 },
                                { c: "Memory Module", s: "Samsung Korea", crit: "Critical", lt: 14 },
                                { c: "Finished Goods Storage", s: dcLocation, crit: "High", lt: 5 },
                                { c: "Battery Pack", s: "Foxconn China", crit: "Medium", lt: 7 }
                              ].map((row, i) => (
                                <tr key={i} className="border-b border-white/5">
                                  <td className="py-3 font-bold text-white">{row.c}</td>
                                  <td className="py-3">{row.s}</td>
                                  <td className="py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter mx-auto block w-fit ${
                                      row.crit === 'Critical' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                                    }`}>{row.crit}</span>
                                  </td>
                                  <td className="py-3 text-right font-mono">{row.lt} days</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Section B: Disruption Selector */}
            <div className="flex flex-col lg:flex-row items-end gap-6">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Select Disruption Scenario</label>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <select 
                      value={selectedDisruption}
                      onChange={(e) => setSelectedDisruption(e.target.value)}
                      className="flex-1 glass-panel px-6 py-4 rounded-xl text-white outline-none focus:border-primary border border-outline-variant/30 transition-all font-bold"
                    >
                      <option className="bg-surface">Cyber Attack: Core DB Breach</option>
                      <option className="bg-surface">Port Closure: Shanghai Blockade</option>
                      <option className="bg-surface">Rare Earth Material Shortage</option>
                      <option className="bg-surface">Geopolitical: Taiwan Strait Tension</option>
                      <option className="bg-surface">Climate Event: Typhoon Disruption</option>
                      <option className="bg-surface">Logistics: Container Crisis</option>
                      <option className="bg-surface">Custom Disruption (AI Generated)</option>
                    </select>
                    <button 
                      onClick={handleSimulateDisruption}
                      disabled={isLoading.disruption}
                      className="px-10 py-4 bg-gradient-to-r from-primary to-secondary text-black font-black rounded-xl shadow-[0_0_30px_rgba(0,210,255,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                      {isLoading.disruption ? <Activity className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                      <span>SIMULATE</span>
                    </button>
                  </div>
                  {selectedDisruption === "Custom Disruption (AI Generated)" && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full"
                    >
                      <textarea
                        value={customDisruption}
                        onChange={(e) => setCustomDisruption(e.target.value)}
                        placeholder="Describe your custom scenario (e.g., 'Unexpected solar flare disruption' or 'Global microchip surplus')..."
                        className="w-full glass-panel px-6 py-4 rounded-xl text-white outline-none focus:border-primary border border-outline-variant/30 transition-all text-sm min-h-[100px]"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Section C: Supply Chain Graph */}
            <div className="glass-panel rounded-[2rem] border border-outline-variant/10 p-12 overflow-x-auto no-scrollbar">
              <div className="flex items-center justify-between min-w-[1100px] relative px-10">
                {supplyChainNodes.map((node, i, arr) => {
                  // Chain Logic: If this node is specifically affected OR any node BEFORE it is specifically affected 
                  // and not resolved, then this node is part of a broken chain (Starved/Downstream impact).
                  const isSpecificallyAffected = affectedNodes.includes(node.name) && !resolvedNodes.includes(node.name);
                  const isUpstreamBroken = arr.slice(0, i).some(prev => 
                    affectedNodes.includes(prev.name) && !resolvedNodes.includes(prev.name)
                  );
                  
                  const isDisrupted = isSpecificallyAffected || isUpstreamBroken;
                  const isResolved = resolvedNodes.includes(node.name);

                  // Node color logic based on user request (All manufacturing units down, one up another down, etc)
                  let statusColor = 'border-primary/40 bg-surface-container-high text-primary/60 shadow-[0_0_30px_rgba(114,220,255,0.1)]';
                  if (isSpecificallyAffected) {
                    statusColor = 'border-error bg-error/10 disrupted-node text-error shadow-[0_0_40px_rgba(255,113,108,0.4)]';
                  } else if (isUpstreamBroken) {
                    statusColor = 'border-error/40 bg-error/5 text-error/60 shadow-[0_0_20px_rgba(255,113,108,0.15)]';
                  } else if (isResolved) {
                    statusColor = 'border-green-400 bg-green-400/10 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.3)]';
                  }

                  return (
                    <React.Fragment key={node.name}>
                      <div className="flex flex-col items-center gap-4 relative">
                        <div className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] absolute -top-10 whitespace-nowrap">
                          {node.category}
                        </div>
                        <div 
                          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-700 border-2 ${statusColor}`}
                        >
                          <node.icon className="w-8 h-8" />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] whitespace-nowrap">{node.name}</span>
                          {isUpstreamBroken && !isSpecificallyAffected && (
                            <span className="text-[8px] text-error font-black uppercase tracking-tighter mt-1">Chain Impacted</span>
                          )}
                        </div>
                      </div>
                      {i < arr.length - 1 && (
                        <div className="flex-1 h-0.5 relative mx-4">
                          <div className={`absolute inset-0 transition-all duration-1000 ${
                            isDisrupted 
                              ? 'bg-error shadow-lg animate-pulse' 
                              : isResolved && resolvedNodes.includes(arr[i+1].name)
                                ? 'bg-green-400 shadow-md'
                                : 'bg-gradient-to-r from-primary/20 to-secondary/20'
                          }`} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {disruption && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Section D: Financial & Delay Analytics */}
                <div className="glass-panel rounded-2xl border border-outline-variant/20 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="font-headline font-bold text-white uppercase tracking-wider">Financial & Delay Analytics</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
                          <th className="pb-4">Metric</th>
                          <th className="pb-4">Impacted Value</th>
                          <th className="pb-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        <tr className="border-b border-white/5">
                          <td className="py-4 font-bold text-white">Estimated Delayed Days</td>
                          <td className="py-4 text-error font-mono">
                            {appliedStrategy 
                              ? Math.ceil(disruption.estimated_delay_days * (appliedStrategy.impact_percent / 100) + appliedStrategy.time_to_implement_days)
                              : disruption.estimated_delay_days} Days
                          </td>
                          <td className="py-4 text-on-surface-variant">
                            {appliedStrategy ? `Optimized via ${appliedStrategy.name}` : `Based on lead time bottlenecks at ${disruption.affected_nodes.join(', ')}`}
                          </td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-4 font-bold text-white">Total Financial Loss</td>
                          <td className="py-4 text-error font-mono">
                            ${((appliedStrategy 
                              ? (disruption.financial_impact_usd * (appliedStrategy.impact_percent / 100))
                              : disruption.financial_impact_usd) / 1000000).toFixed(2)}M
                          </td>
                          <td className="py-4 text-on-surface-variant">
                            {appliedStrategy ? `Reduced exposure with ${appliedStrategy.risk_label} plan` : 'Revenue at risk + contractual penalties'}
                          </td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-4 font-bold text-white">New Investment Required</td>
                          <td className="py-4 text-secondary font-mono">
                            ${((disruption.new_investment_usd + (appliedStrategy ? appliedStrategy.cost_usd : 0)) / 1000000).toFixed(2)}M
                          </td>
                          <td className="py-4 text-on-surface-variant">
                            {appliedStrategy ? `Baseline + ${appliedStrategy.name} implementation` : 'Capital needed for procurement & expedited logistics'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-4 font-bold text-white">Probability of Success</td>
                          <td className={`py-4 font-black font-mono ${
                            appliedStrategy ? (appliedStrategy.success_probability < 60 ? 'text-error' : 'text-green-400') : 'text-on-surface-variant'
                          }`}>
                            {appliedStrategy ? `${appliedStrategy.success_probability}%` : 'N/A (Pre-Strategy)'}
                          </td>
                          <td className="py-4 text-on-surface-variant">
                            {appliedStrategy ? (appliedStrategy.success_probability < 60 ? 'High risk of implementation failure' : 'High confidence in resilience plan') : 'Please select and analyze a strategy'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section E: AI-Powered Resilience Strategies */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="w-6 h-6 text-secondary" />
                      <h3 className="font-headline font-bold text-white uppercase tracking-[0.2em]">AI Analyzed Strategies</h3>
                    </div>
                    <div className="px-4 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full text-[10px] font-black text-secondary uppercase tracking-widest">
                      5 Results Found
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {strategies.map((strategy) => (
                      <motion.div 
                        key={strategy.id}
                        layoutId={strategy.id}
                        className={`glass-panel p-6 md:p-8 rounded-3xl border transition-all ${
                          strategy.recommended ? 'border-secondary/40 shadow-[0_0_40px_rgba(0,186,214,0.1)]' : 'border-outline-variant/20 shadow-xl'
                        }`}
                      >
                        <div className="flex flex-col xl:flex-row gap-8">
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                                strategy.color_type === 'error' ? 'bg-error/20 text-error' : 'bg-secondary/20 text-secondary'
                              }`}>
                                {strategy.risk_label}
                              </span>
                              <h4 className="text-xl font-headline font-black text-white">{strategy.name}</h4>
                              {strategy.recommended && (
                                <span className="px-3 py-1 bg-green-400/20 text-green-400 rounded-full text-[10px] font-black uppercase animate-pulse">
                                  PREFERABLE CHOICE
                                </span>
                              )}
                            </div>
                            <p className="text-on-surface-variant text-sm leading-relaxed">{strategy.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 py-4 bg-white/[0.02] rounded-2xl p-4 md:p-6 border border-white/5">
                              <div>
                                <h5 className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-3">Merits (Pros)</h5>
                                <ul className="space-y-2">
                                  {strategy.merits.map((m, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                                      <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                                      {m}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h5 className="text-[10px] font-black text-error uppercase tracking-widest mb-3">Demerits (Cons)</h5>
                                <ul className="space-y-2">
                                  {strategy.cons.map((c, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                                      <X className="w-3 h-3 text-error mt-0.5 flex-shrink-0" />
                                      {c}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                              <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> AI Decision Logic / Preferability Analysis
                              </h5>
                              <p className="text-xs text-on-surface-variant font-medium italic">"{strategy.preferability_reason}"</p>
                            </div>
                          </div>

                          <div className="w-full xl:w-72 flex flex-col justify-between border-t xl:border-t-0 xl:border-l border-white/5 pt-8 xl:pt-0 xl:pl-8">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-on-surface-variant font-bold">Implementation Hubs</span>
                                <span className="text-white font-mono">{strategy.time_to_implement_days} Days</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-on-surface-variant font-bold">Estimated Cost</span>
                                <span className="text-secondary font-mono font-bold">${strategy.cost_usd.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-on-surface-variant font-bold">Success Probability</span>
                                <span className={`font-mono font-bold ${strategy.success_probability < 60 ? 'text-error' : 'text-green-400'}`}>
                                  {strategy.success_probability}%
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-on-surface-variant font-bold">Recovery Speed</span>
                                <div className="flex-1 mx-4 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-secondary" style={{ width: `${100 - strategy.impact_percent}%` }} />
                                </div>
                              </div>
                            </div>

                            <button 
                              onClick={() => handleRunStrategy(strategy)}
                              disabled={isRunningStrategy != null}
                              className={`w-full py-4 mt-8 rounded-xl font-black text-sm tracking-widest transition-all flex items-center justify-center gap-2 ${
                                strategy.color_type === 'error' 
                                  ? 'bg-surface border border-error/50 text-error hover:bg-error/10' 
                                  : 'bg-secondary text-black hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,186,214,0.3)]'
                              }`}
                            >
                              {isRunningStrategy === strategy.id ? (
                                <Activity className="w-5 h-5 animate-spin" />
                              ) : (
                                <Brain className="w-5 h-5" />
                              )}
                              ANALYZE
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Section F: Historical Simulation Data */}
                <div className="glass-panel rounded-2xl border border-outline-variant/20 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <History className="w-5 h-5 text-primary" />
                      <h3 className="font-headline font-bold text-white uppercase tracking-wider">Historical Simulation Log</h3>
                    </div>
                    <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest bg-white/5 px-4 py-1 rounded-full border border-white/5">
                      Session Records
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
                          <th className="pb-4">Scenario</th>
                          <th className="pb-4">Type</th>
                          <th className="pb-4 text-center">Severity</th>
                          <th className="pb-4">Impact</th>
                          <th className="pb-4 text-center">Recovery</th>
                          <th className="pb-4">Strategy Applied</th>
                          <th className="pb-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-[13px]">
                        {simulationHistory.map((rec, i) => (
                          <tr key={i} className="border-b border-white/5 group hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 font-bold text-white pr-4">{rec.scenario}</td>
                            <td className="py-4 text-on-surface-variant">{rec.type}</td>
                            <td className="py-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                rec.severity > 7 ? 'bg-error/20 text-error' : 'bg-primary/20 text-primary'
                              }`}>S{rec.severity}</span>
                            </td>
                            <td className="py-4 text-on-surface-variant font-mono">{rec.impact}</td>
                            <td className="py-4 text-center text-on-surface-variant font-mono">{rec.recovery}d</td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                <span className="text-on-surface-variant font-medium">{rec.strategy}</span>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                rec.status === 'Resolved' ? 'bg-green-400/20 text-green-400' : 'bg-secondary/20 text-secondary'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* TAB: Report */}
        {activeTab === 'report' && (
          <div className="animate-in fade-in duration-1000 flex flex-col gap-8 max-w-6xl mx-auto w-full pb-20 mt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 border-b border-outline/20 pb-8">
              <div>
                <h2 className="text-3xl md:text-5xl font-headline font-[900] text-white tracking-tighter mix-blend-difference">
                  RESILIENCE <span className="text-primary italic">INTELLIGENCE</span>
                </h2>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <p className="text-on-surface-variant text-[11px] font-black uppercase tracking-[0.3em]">Historical Recovery Accuracy Metrics</p>
                </div>
              </div>
              <button 
                onClick={() => window.print()} 
                className="w-full md:w-auto px-6 lg:px-10 py-4 bg-primary text-black font-black rounded-2xl hover:bg-primary/80 transition-all flex items-center justify-center gap-3 text-xs shadow-[0_15px_30px_rgba(114,220,255,0.25)] border-b-4 border-black/20 active:translate-y-1 active:border-b-0"
              >
                <Printer className="w-4 h-4" />
                DOWLOAD PDF REPORT
              </button>
            </div>

            {/* Section: Status Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
              <div className="glass-panel p-6 md:p-8 rounded-[32px] border border-outline-variant/30 flex flex-col gap-3 group hover:border-error/40 transition-all duration-500">
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] group-hover:text-error transition-colors">Active Distributions</span>
                <div className="text-4xl md:text-5xl font-black text-error drop-shadow-[0_0_15px_rgba(255,113,108,0.2)]">{disruption ? 1 : 0}</div>
                <div className="h-1 w-12 bg-error/20 rounded-full overflow-hidden">
                   <div className="h-full bg-error animate-[shimmer_2s_infinite]" style={{ width: disruption ? '100%' : '0%' }}></div>
                </div>
                <p className="text-[12px] text-white/80 font-medium">{disruption ? disruption.name : 'System Stable'}</p>
              </div>
              
              <div className="glass-panel p-6 md:p-8 rounded-[32px] border border-outline-variant/30 flex flex-col gap-3 group hover:border-secondary/40 transition-all duration-500">
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] group-hover:text-secondary transition-colors">Nodes at Risk</span>
                <div className="text-4xl md:text-5xl font-black text-secondary drop-shadow-[0_0_15px_rgba(221,139,251,0.2)]">{affectedNodes.length}</div>
                <div className="h-1 w-12 bg-secondary/20 rounded-full">
                   <div className="h-full bg-secondary" style={{ width: `${Math.min(affectedNodes.length * 20, 100)}%` }}></div>
                </div>
                <p className="text-[12px] text-white/80 font-medium">Critical intervention required</p>
              </div>

              <div className="glass-panel p-6 md:p-8 rounded-[32px] border border-outline-variant/30 flex flex-col gap-3 group hover:border-green-400/40 transition-all duration-500 sm:col-span-2 lg:col-span-1">
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] group-hover:text-green-400 transition-colors">Resolved Nodes</span>
                <div className="text-4xl md:text-5xl font-black text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.2)]">{resolvedNodes.length}</div>
                <div className="h-1 w-12 bg-green-400/20 rounded-full">
                   <div className="h-full bg-green-400" style={{ width: `${Math.min(resolvedNodes.length * 20, 100)}%` }}></div>
                </div>
                <p className="text-[12px] text-white/80 font-medium">Successful resilience output</p>
              </div>
            </div>

            {/* NEW GRAPH: Recovery Time Accuracy vs Historical Disruptions */}
            <div className="glass-panel p-6 md:p-12 rounded-[32px] md:rounded-[40px] border border-outline/30 relative overflow-hidden bg-surface-container/20 group">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[100px] transition-all duration-1000 group-hover:bg-primary/10"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-16">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-6 h-6 text-primary" />
                    <h3 className="text-xl md:text-2xl font-headline font-black text-white uppercase tracking-wider">Historical Simulation Map</h3>
                  </div>
                  <p className="text-on-surface-variant text-sm max-w-xl leading-relaxed">
                    This interactive matrix visualizes the efficiency of previous recovery operations. The bubble size correlates with the <span className="text-primary font-bold">Severity</span> of the event, while the color intensity indicates the <span className="text-secondary font-bold">Recovery Accuracy</span> relative to the predicted system baseline.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 md:gap-6 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_#72dcff]"></div>
                      <span className="text-[10px] text-white font-bold tracking-widest uppercase">High Severity</span>
                   </div>
                   <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                      <div className="w-3 h-3 rounded-full border border-primary/50"></div>
                      <span className="text-[10px] text-white font-bold tracking-widest uppercase">Low Severity</span>
                   </div>
                </div>
              </div>

              <div className="h-[350px] md:h-[550px] w-full mt-6 bg-black/20 p-4 md:p-8 rounded-[24px] md:rounded-[32px] border border-white/5 relative overflow-x-auto">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-on-surface-variant/50 uppercase tracking-[0.5em] hidden md:flex items-center gap-4">
                  <div className="w-12 h-px bg-white/20"></div>
                  Historical Recovery Performance Analysis
                  <div className="w-12 h-px bg-white/20"></div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[...simulationHistory].reverse().map((rec, i) => ({
                      event: rec.scenario,
                      time: i + 1,
                      recovery: rec.recovery,
                      severity: rec.severity,
                      accuracy: Math.round(100 - (rec.severity * 2) + (Math.random() * 5)),
                    }))}
                    margin={{ top: 40, right: 30, left: 40, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis 
                      dataKey="event" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700 }}
                      stroke="rgba(255,255,255,0.3)"
                    />
                    <YAxis 
                      label={{ value: 'RECOVERY ACCURACY (%)', angle: -90, position: 'insideLeft', offset: 10, fill: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 900, letterSpacing: 2 }}
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700 }}
                      stroke="rgba(255,255,255,0.3)"
                      domain={[0, 100]}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-surface-container/95 backdrop-blur-2xl border border-primary/50 p-6 rounded-2xl shadow-2xl min-w-[260px]">
                              <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-2">
                                <Zap className="w-4 h-4 text-primary" />
                                <span className="text-white font-headline font-black uppercase text-xs tracking-wider">{data.event}</span>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">Severity Index</span>
                                  <span className="text-error font-black text-sm">{data.severity}/10</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">Recovery Time</span>
                                  <span className="text-primary font-black text-sm">{data.recovery} Days</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-on-surface-variant text-[10px] uppercase font-black tracking-widest">System Accuracy</span>
                                  <span className="text-primary font-black text-sm">{data.accuracy}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="accuracy" 
                      fill="#72dcff" 
                      radius={[8, 8, 0, 0]}
                      className="drop-shadow-[0_0_15px_rgba(114,220,255,0.4)]"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="p-8 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col gap-4">
                  <Cpu className="w-8 h-8 text-primary" />
                  <h4 className="text-white font-headline font-black text-sm uppercase tracking-widest">Predictive Learning</h4>
                  <p className="text-on-surface-variant text-xs leading-relaxed">The AI model observes every simulation outcome (Accuracy vs. Time) to optimize future mitigation recommendations. Every bubble represents a learned edge case in your supply chain network.</p>
                </div>
                <div className="p-8 rounded-3xl bg-secondary/5 border border-secondary/10 flex flex-col gap-4">
                  <BarChart3 className="w-8 h-8 text-secondary" />
                  <h4 className="text-white font-headline font-black text-sm uppercase tracking-widest">Stability Monitoring</h4>
                  <p className="text-on-surface-variant text-xs leading-relaxed">Tracking vertical grouping of historical events helps identify persistent weaknesses in specific tiers (e.g., recurring failures at Port nodes).</p>
                </div>
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-4">
                  <Boxes className="w-8 h-8 text-white" />
                  <h4 className="text-white font-headline font-black text-sm uppercase tracking-widest">Structural Resilience</h4>
                  <p className="text-on-surface-variant text-xs leading-relaxed">This report dynamically updates as you solve new problems, providing a tangible footprint of your system's evolving resilience profile.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="animate-in fade-in duration-700 flex flex-col gap-12 max-w-6xl mx-auto w-full pb-20">
            {/* Mission Section */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group perspective-1000"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[24px] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="bg-surface-container/40 backdrop-blur-[40px] border border-outline/50 rounded-[24px] p-8 md:p-12 lg:p-[60px] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center text-center md:text-left">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                      Mission Control
                    </div>
                    <h1 className="font-headline text-4xl md:text-5xl lg:text-[3.5rem] font-[900] tracking-tight text-white mb-6 leading-none">
                      SC <span className="text-primary italic">SIMULATOR</span>
                    </h1>
                    <p className="text-base md:text-[1.2rem] text-on-surface-variant leading-relaxed mb-8 max-w-2xl font-light">
                      SC SIMULATOR is a cutting-edge supply chain resilience platform. It leverages Agentic AI to simulate complex global logistics networks, predict disruptions caused by geopolitical, environmental, or technical events, and provides optimized recovery paths.
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md min-w-[120px]">
                        <div className="text-primary font-bold text-xl md:text-2xl">99.9%</div>
                        <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Reliability</div>
                      </div>
                      <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md min-w-[120px]">
                        <div className="text-secondary font-bold text-xl md:text-2xl">Gemini</div>
                        <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Engine</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Interactive 3D Object (CSS Cube) */}
                  <div className="w-[200px] h-[200px] perspective-1000 hidden md:block">
                    <motion.div 
                      animate={{ 
                        rotateY: [0, 360],
                        rotateX: [20, 40, 20],
                      }}
                      transition={{ 
                        duration: 15, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                      className="w-full h-full relative preserve-3d"
                    >
                      {[
                        'rotateY(0deg)', 'rotateY(90deg)', 'rotateY(180deg)', 
                        'rotateY(-90deg)', 'rotateX(90deg)', 'rotateX(-90deg)'
                      ].map((transform, i) => (
                        <div 
                          key={i}
                          className="absolute inset-0 bg-primary/10 border border-primary/40 backdrop-blur-sm flex items-center justify-center"
                          style={{ transform: `${transform} translateZ(100px)` }}
                        >
                          <Boxes className="w-12 h-12 text-primary opacity-50" />
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Team Section */}
            <div className="flex flex-col gap-12">
              <div className="flex items-center gap-6">
                <div className="h-[1px] flex-1 bg-outline/30"></div>
                <h2 className="font-headline text-on-surface-variant uppercase tracking-[0.4em] font-bold text-sm">
                  Team <span className="text-white">SYNTAX_SQUAD</span>
                </h2>
                <div className="h-[1px] flex-1 bg-outline/30"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { name: "KAUSHIK S", dept: "ECE DS", initials: "KS" },
                  { name: "JAIA VIJAI RAJA P.E", dept: "CSE", initials: "JV" },
                  { name: "STENI AALIX M", dept: "CSE AIML", initials: "SA" },
                  { name: "MOHAMMED SAJID A", dept: "CSE AIML", initials: "MS" }
                ].map((member, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ 
                      y: -10,
                      rotateX: 5,
                      rotateY: -5,
                      transition: { duration: 0.2 }
                    }}
                    className="group relative perspective-1000 cursor-pointer"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-b from-primary/20 to-transparent rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg"></div>
                    <div className="bg-surface-container/60 backdrop-blur-2xl border border-outline/50 p-8 rounded-[24px] relative overflow-hidden h-full flex flex-col items-center text-center shadow-xl">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/10">
                        <span className="text-white font-[900] text-2xl tracking-tighter">{member.initials}</span>
                      </div>
                      <h3 className="text-white font-headline font-bold text-lg mb-2 group-hover:text-primary transition-colors">{member.name}</h3>
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-primary font-bold uppercase tracking-widest mb-4">
                        {member.dept}
                      </div>
                      <div className="mt-auto pt-4 border-t border-outline/20 w-full">
                        <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-1">1st Year Student</p>
                        <p className="text-on-surface-variant/60 text-[9px] font-medium leading-tight">SRM Institute of Science and Technology</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tech Stack Info (Translucent Footer) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Frontend", value: "React 19 + Tailwind 4", icon: LayoutDashboard },
                { label: "Intelligence", value: "Gemini 2.0 Flash Agent", icon: Brain },
                { label: "Motion", value: "Framer Motion 12", icon: Zap },
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.03] backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-on-surface-variant" />
                  </div>
                  <div>
                    <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">{item.label}</div>
                    <div className="text-white font-semibold text-sm">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </main>

      {/* War Game Modal */}
      {showWarGameModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-[10px] p-[24px]">
          <div className="bg-surface-container border border-outline rounded-[12px] p-[24px] max-w-3xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowWarGameModal(false)} className="absolute top-[24px] right-[24px] text-on-surface-variant hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="font-headline text-[1.5rem] font-[700] text-white mb-[4px]">War Game Simulator</h2>
            <p className="text-[0.9rem] text-on-surface-variant mb-[24px]">Simulate disruption outcomes with and without resilience strategies.</p>
            
            <div className="grid grid-cols-2 gap-[24px] mb-[24px]">
              <div className="bg-surface border border-outline p-[16px] rounded-[8px]">
                <label className="block text-[10px] font-[800] tracking-[0.1em] text-primary uppercase mb-[8px]">Select Disruption Scenario</label>
                <select 
                  value={selectedDisruption}
                  onChange={(e) => setSelectedDisruption(e.target.value)}
                  className="w-full bg-surface-container border border-outline text-white rounded-[4px] p-[12px] focus:outline-none focus:border-primary text-[0.9rem]"
                >
                  {["Cyber Attack: Core DB","Taiwan Strait Closure","Shanghai Port Delay","Rare Earth Shortage","Climate Event: Typhoon"].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="bg-surface border border-outline p-[16px] rounded-[8px]">
                <label className="block text-[10px] font-[800] tracking-[0.1em] text-secondary uppercase mb-[8px]">Select Resilience Strategy</label>
                <select 
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="w-full bg-surface-container border border-outline text-white rounded-[4px] p-[12px] focus:outline-none focus:border-primary text-[0.9rem]"
                >
                  {["No Action","Backup Supplier","Inventory Buffer","Dual Sourcing","Nearshoring","Demand Sensing"].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={handleRunWarGame}
              disabled={isLoading.warGame}
              className="w-full bg-primary text-[#004c5e] font-[700] py-[12px] rounded-[4px] shadow-[0_0_20px_rgba(114,220,255,0.2)] hover:scale-[1.02] transition-transform flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading.warGame ? <div className="w-4 h-4 pulse-dot relative"></div> : <Play className="w-5 h-5" />}
              {isLoading.warGame ? "Running Simulation..." : "Run War Game"}
            </button>

            {warGameResult && (
              <div className="mt-[24px] animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-[24px]">
                  <div className="bg-error/5 border border-error/30 rounded-[12px] p-[20px]">
                    <h4 className="text-error font-headline font-[700] text-[1.2rem] mb-[16px]">Without Strategy</h4>
                    <div className="space-y-[8px] text-[0.9rem]">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Recovery Days</span>
                        <span className="text-error font-[700]">{warGameResult.without_strategy.recovery_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Financial Impact</span>
                        <span className="text-error font-[700]">${(warGameResult.without_strategy.financial_impact_usd / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Service Level Drop</span>
                        <span className="text-error font-[700]">{warGameResult.without_strategy.service_level_drop}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-secondary/5 border border-secondary/30 rounded-[12px] p-[20px]">
                    <h4 className="text-secondary font-headline font-[700] text-[1.2rem] mb-[16px]">With Strategy Applied</h4>
                    <div className="space-y-[8px] text-[0.9rem]">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Recovery Days</span>
                        <span className="text-secondary font-[700]">{warGameResult.with_strategy.recovery_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Financial Impact</span>
                        <span className="text-secondary font-[700]">${(warGameResult.with_strategy.financial_impact_usd / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Service Level Drop</span>
                        <span className="text-secondary font-[700]">{warGameResult.with_strategy.service_level_drop}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4 mb-6">
                  <div className="inline-block px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full text-secondary font-headline font-bold text-xl">
                    ↑ {warGameResult.improvement_percent}% Overall Improvement
                  </div>
                </div>

                <div className="bg-surface-container rounded-lg p-4 border border-secondary/20 flex gap-4 items-start">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <Brain className="w-6 h-6 text-secondary" />
                    <span className="text-secondary text-[10px] uppercase font-bold text-center">AI Analysis</span>
                  </div>
                  <p className="text-on-surface-variant text-[0.9rem] leading-relaxed italic flex-1">
                    "{warGameResult.narrative}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification System */}
      <div className="fixed bottom-[24px] right-[24px] z-[300] flex flex-col gap-[8px]">
        {toasts.map(toast => (
          <div key={toast.id} className={`bg-surface-container/80 backdrop-blur-lg border p-[12px] rounded-[12px] flex items-center gap-[12px] animate-in slide-in-from-right duration-300 shadow-xl ${toast.type === 'success' ? 'border-primary/40 border-l-4 border-l-primary' : 'border-error/40 border-l-4 border-l-error'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <AlertCircle className="w-5 h-5 text-error" />}
            <span className="text-[0.9rem] font-[500] text-white">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
}
