import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─── THEME ───────────────────────────────────────────────────────────────────
const G = {
  bg: "#04040d", card: "#0a0a18", border: "#1a1a35",
  accent: "#e63946", accentDim: "#e6394612", accentBorder: "#e6394650",
  gold: "#f0c040", goldDim: "#f0c04012", goldBorder: "#f0c04050",
  green: "#22c55e", greenDim: "#22c55e12", greenBorder: "#22c55e50",
  blue: "#60a5fa", blueDim: "#60a5fa12",
  purple: "#a78bfa", purpleDim: "#a78bfa12",
  text: "#eeeef8", muted: "#5a5a80", dim: "#12122a", border2: "#22223a",
};

const GLASS = {
  background: "rgba(10,10,28,0.65)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
};

const sx = {
  card: {
    ...GLASS, borderRadius: 18,
    padding: "1.25rem 1.4rem",
    transition: "box-shadow 0.25s, border-color 0.25s",
  },
  btn: (color = G.accent) => ({
    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
    border: "none", borderRadius: 10, cursor: "pointer",
    color: "#000", fontWeight: 700, fontSize: "0.82rem",
    padding: "0.5rem 1.1rem", letterSpacing: "0.03em",
    boxShadow: `0 0 20px ${color}40`,
    transition: "box-shadow 0.2s, transform 0.15s",
  }),
  btnGhost: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, cursor: "pointer", color: G.muted,
    fontWeight: 600, fontSize: "0.82rem", padding: "0.5rem 1.1rem",
    transition: "all 0.2s",
  },
  tag: (color) => ({
    background: color + "18", color, border: `1px solid ${color}50`,
    borderRadius: 6, padding: "0.18rem 0.6rem", fontSize: "0.72rem", fontWeight: 700,
    display: "inline-block", boxShadow: `0 0 8px ${color}20`,
  }),
  input: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: G.text, padding: "0.55rem 0.9rem",
    fontSize: "0.85rem", outline: "none", width: "100%",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  select: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, color: G.text, padding: "0.55rem 0.9rem",
    fontSize: "0.85rem", outline: "none",
  },
};

// ─── DATA ────────────────────────────────────────────────────────────────────
const NICHES = [
  {
    id: 1, name: "AI Tools Daily", slug: "ai-tools", emoji: "🤖",
    profitScore: 95, monthlyRevPotential: 18000, competition: "Medium",
    timeToProfit: "45 days", audienceSize: "8.2M active",
    platforms: ["Twitter/X", "LinkedIn", "Newsletter"],
    monetization: ["SaaS affiliates (30-45% recurring)", "Digital product bundle", "Newsletter sponsorships"],
    topAffiliates: ["Copy.ai (45%)", "Jasper AI (30%)", "Midjourney", "Notion"],
    whyFaceless: "AI screenshots & demos. No face, no voice, no story. Pure value.",
    angles: ["Tool comparisons", "Productivity automations", "Weekly AI digest", "ROI case studies"],
  },
  {
    id: 2, name: "Faceless Finance", slug: "finance", emoji: "💰",
    profitScore: 92, monthlyRevPotential: 22000, competition: "High",
    timeToProfit: "60 days", audienceSize: "24M active",
    platforms: ["Instagram", "TikTok", "YouTube Shorts", "Newsletter"],
    monetization: ["Broker & card affiliates ($5-$25/signup)", "Digital courses ($47-$197)", "Newsletter sponsorships"],
    topAffiliates: ["Robinhood", "Acorns", "CreditKarma", "Coinbase ($10/signup)"],
    whyFaceless: "Data charts, text overlays, stock footage. No face = no liability in finance space.",
    angles: ["Savings systems", "Investment basics", "Side hustle income", "Budget templates"],
  },
  {
    id: 3, name: "Productivity Ghost", slug: "productivity", emoji: "⚡",
    profitScore: 88, monthlyRevPotential: 14000, competition: "Medium",
    timeToProfit: "30 days", audienceSize: "12M active",
    platforms: ["Twitter/X", "Pinterest", "Newsletter"],
    monetization: ["Notion templates ($17-$97)", "App affiliates (20% recurring)", "1:1 coaching upsell"],
    topAffiliates: ["Notion", "Todoist", "Readwise", "Calendly"],
    whyFaceless: "Screenshots and templates are the content. Zero identity required.",
    angles: ["Notion systems", "Time blocking", "Deep work protocols", "Weekly reviews"],
  },
  {
    id: 4, name: "Crypto Data Feed", slug: "crypto", emoji: "₿",
    profitScore: 85, monthlyRevPotential: 20000, competition: "Very High",
    timeToProfit: "90 days", audienceSize: "18M active",
    platforms: ["Twitter/X", "Telegram", "Newsletter"],
    monetization: ["Exchange affiliates", "Premium signals newsletter ($29-$99/mo)", "Data tool affiliates"],
    topAffiliates: ["Coinbase", "Binance", "Ledger", "TradingView"],
    whyFaceless: "On-chain data, charts, market summaries. Anonymous is actually the norm here.",
    angles: ["On-chain analytics", "Chart analysis", "Token research", "Market weekly"],
  },
  {
    id: 5, name: "Health Data Lab", slug: "health", emoji: "🧬",
    profitScore: 90, monthlyRevPotential: 16000, competition: "Medium",
    timeToProfit: "45 days", audienceSize: "31M active",
    platforms: ["Instagram", "Pinterest", "TikTok"],
    monetization: ["Supplement affiliates ($20-60/sale)", "Meal plan PDFs ($27-$47)", "Fitness app affiliates"],
    topAffiliates: ["Amazon (8-10%)", "iHerb", "MyFitnessPal Pro", "Noom"],
    whyFaceless: "Infographics, food photography (stock), data visualizations. No face needed.",
    angles: ["Research summaries", "Supplement stacks", "Workout science", "Meal prep systems"],
  },
];

const AFFILIATES = [
  { id:1, name:"Copy.ai",         cat:"AI Tools",    commission:"45% recurring",  epc:"$12.40", cookie:"90d", payout:"$50",  tier:"gold"   },
  { id:2, name:"Jasper AI",       cat:"AI Tools",    commission:"30% recurring",  epc:"$8.20",  cookie:"60d", payout:"$50",  tier:"gold"   },
  { id:3, name:"Semrush",         cat:"Marketing",   commission:"$200/sale",      epc:"$22.50", cookie:"120d",payout:"$50",  tier:"gold"   },
  { id:4, name:"NordVPN",         cat:"Tech",        commission:"40% + recurring",epc:"$5.60",  cookie:"30d", payout:"$50",  tier:"silver" },
  { id:5, name:"Notion Affiliate",cat:"Productivity",commission:"20% for 1yr",   epc:"$3.20",  cookie:"60d", payout:"$50",  tier:"silver" },
  { id:6, name:"Coinbase",        cat:"Crypto",      commission:"$10/signup",     epc:"$3.80",  cookie:"30d", payout:"$50",  tier:"silver" },
  { id:7, name:"Robinhood",       cat:"Finance",     commission:"$5-25/account",  epc:"$4.50",  cookie:"30d", payout:"$25",  tier:"silver" },
  { id:8, name:"Amazon Assoc.",   cat:"General",     commission:"3-10%",          epc:"$0.45",  cookie:"24h", payout:"$10",  tier:"bronze" },
  { id:9, name:"Acorns",          cat:"Finance",     commission:"$5/install",     epc:"$2.10",  cookie:"30d", payout:"$25",  tier:"bronze" },
  { id:10,name:"Skillshare",      cat:"Education",   commission:"$7/trial",       epc:"$1.80",  cookie:"30d", payout:"$50",  tier:"bronze" },
];

const PRODUCTS = [
  { id:1, name:"AI Tools Master Directory", niche:"AI Tools", price:27, platform:"Gumroad", format:"PDF + Notion", timeToCreate:"3hrs (AI-assisted)", revTarget:200 },
  { id:2, name:"Faceless Finance Playbook", niche:"Finance",  price:47, platform:"Gumroad", format:"PDF Guide",    timeToCreate:"4hrs (AI-assisted)", revTarget:150 },
  { id:3, name:"Ultimate Notion Pack",      niche:"Productivity",price:37,platform:"Gumroad",format:"Notion Template",timeToCreate:"2hrs (template)", revTarget:180 },
  { id:4, name:"Crypto Data Toolkit",       niche:"Crypto",   price:57, platform:"Gumroad", format:"Google Sheets",timeToCreate:"5hrs",              revTarget:100 },
  { id:5, name:"30-Day Nutrition System",   niche:"Health",   price:34, platform:"Gumroad", format:"PDF + Tracker", timeToCreate:"3hrs (AI-assisted)",revTarget:160 },
];

const CONTENT_TEMPLATES = [
  {
    id:1, niche:"AI Tools", platform:"Twitter/X", type:"Thread",
    title:"10 AI Tools That Replace Expensive Hires",
    prompt: `Write a Twitter thread about 10 AI tools that can replace expensive hires. For each tool: name, what role it replaces, key capability, monthly cost, hours saved per week. Start with a hook "🧵 10 AI tools replacing $120K/year employees:" Make it data-driven, no fluff, add RT call-to-action at end.`,
    monetization:"Affiliate links in replies",
  },
  {
    id:2, niche:"Finance", platform:"Instagram", type:"Carousel",
    title:"The $1,000/Month Savings System",
    prompt:`Write Instagram carousel slide copy for "Save $1,000/month with this exact system". 6 slides: Hook, 50/30/20 rule, automate savings, high-yield account comparison, tracking template preview, CTA for free template. Each slide max 15 words. Make it visually storyboard-friendly.`,
    monetization:"Lead magnet → email list → affiliate offers",
  },
  {
    id:3, niche:"Productivity", platform:"Twitter/X", type:"Single Post",
    title:"The Notion Deep Work Setup",
    prompt:`Write a single viral Twitter post about a Notion productivity system for deep work. Mention: time-blocking template, distraction tracker, weekly review system. End with a number of people using it and a link-in-bio CTA. Max 280 characters. Make it feel like social proof is real.`,
    monetization:"Digital product (Notion template $17-47)",
  },
  {
    id:4, niche:"Crypto", platform:"Twitter/X", type:"Thread",
    title:"Weekly On-Chain Data Digest",
    prompt:`Write a weekly crypto on-chain data digest Twitter thread. Include: BTC key metric, ETH key metric, DeFi TVL, one key market insight. Format with emojis (🟢 bullish 🔴 bearish ⚡ neutral). End with premium newsletter upsell. Keep it analytical and authoritative.`,
    monetization:"Premium newsletter upsell",
  },
  {
    id:5, niche:"Health", platform:"Instagram", type:"Carousel",
    title:"The Evidence-Based Morning Stack",
    prompt:`Write Instagram carousel copy for "The evidence-based morning supplement stack". 7 slides: hook, magnesium, vitamin D, omega-3, creatine, zinc, summary with affiliate disclaimer. Each slide: supplement name, what the science says, optimal dose, when to take. Cite general research, not specific papers.`,
    monetization:"iHerb / Amazon affiliate links",
  },
];

const REVENUE_DATA = [
  { month:"M1", affiliate:200,  digital:500,  newsletter:0,    sponsored:0,    total:700   },
  { month:"M2", affiliate:800,  digital:1500, newsletter:200,  sponsored:0,    total:2500  },
  { month:"M3", affiliate:1800, digital:3000, newsletter:500,  sponsored:500,  total:5800  },
  { month:"M4", affiliate:3000, digital:4500, newsletter:1000, sponsored:1000, total:9500  },
  { month:"M5", affiliate:4500, digital:5500, newsletter:1500, sponsored:1500, total:13000 },
  { month:"M6", affiliate:5000, digital:6000, newsletter:2000, sponsored:2000, total:15000 },
];

const EXPENSES = [
  { name:"Claude API (content engine)",     cost:20, note:"~150K tokens/month" },
  { name:"Domain (anonymous pen name)",     cost:10, note:"Annual ÷ 12" },
  { name:"VPN (operational security)",      cost:5,  note:"Mullvad recommended" },
  { name:"Browser profile / proxy",         cost:15, note:"GoLogin or Multilogin" },
  { name:"Buffer / Typefully scheduling",   cost:0,  note:"Free tier" },
  { name:"Canva (visuals)",                 cost:0,  note:"Free tier" },
  { name:"Beehiiv (newsletter)",            cost:0,  note:"Free up to 2,500 subs" },
  { name:"Gumroad (digital products)",      cost:0,  note:"10% fee on sales" },
];

const ROADMAP = [
  {
    day:"Day 1–2", phase:"Infrastructure", color: G.blue,
    tasks:[
      "Create anonymous ProtonMail — no real name, no phone number",
      "Set up Mullvad VPN ($5) — always on, always anonymous",
      "Create Gumroad account under pen name — this is your 'store'",
      "Set up Beehiiv newsletter (free) — email list = owned audience",
      "Register GoLogin browser profile ($15) — separate digital fingerprint",
    ],
    cost:"$20", outcome:"Ghost infrastructure operational. Zero identity exposure.",
  },
  {
    day:"Day 3–4", phase:"Niche Selection", color: G.purple,
    tasks:[
      "Pick ONE primary niche from the 5 — AI Tools if unsure",
      "Study top 20 accounts in niche — learn format, not content",
      "Identify top 5 affiliate programs — apply to all 5 today",
      "Define 3–5 content pillars (specific angles you'll own)",
      "Get Claude API key — set $20/month budget cap",
    ],
    cost:"$5", outcome:"Clear positioning locked. Affiliate applications submitted.",
  },
  {
    day:"Day 5–7", phase:"Content Factory", color: G.gold,
    tasks:[
      "Generate 30 content pieces using Claude API + templates",
      "Design 10 carousel templates in Canva (text-only or icons, no photos)",
      "Write first digital product with AI assistance — 3–4 hours total",
      "Price it at $27–$47 and upload to Gumroad",
      "Create lead magnet (free mini-guide) for newsletter signup",
    ],
    cost:"$5 (API)", outcome:"30 posts banked. Product live. Revenue engine primed.",
  },
  {
    day:"Day 8–10", phase:"Platform Launch", color: G.accent,
    tasks:[
      "Create Twitter/X account — keyword-based name, no face, no bio photo",
      "Create Instagram account — niche topic format (e.g. @AIDailyTools)",
      "Post first 10 pieces across platforms — manual, not scheduled yet",
      "Add affiliate links to all published content immediately",
      "Submit to 2 additional niche affiliate programs",
    ],
    cost:"$0", outcome:"Live on 2+ platforms. All content monetized from day 1.",
  },
  {
    day:"Day 11–13", phase:"Growth Engine", color: G.green,
    tasks:[
      "Engage in niche: comment, follow, repost — 30 min/day max",
      "Schedule next 2 weeks of content via Buffer free tier",
      "Send first 3 newsletter issues with Beehiiv",
      "Drive initial traffic from Reddit (r/personalfinance, r/AItools, etc.)",
      "A/B test 2 content formats — analyze what performs",
    ],
    cost:"$0", outcome:"Automated publishing pipeline. First organic followers.",
  },
  {
    day:"Day 14", phase:"Ghost Machine Lock", color: G.green,
    tasks:[
      "Audit best-performing content — double down on winners",
      "Set weekly content generation schedule: 2hrs/week total input",
      "Add referral incentive for newsletter growth",
      "Document every SOP — this system runs without you",
      "Project Month 2 targets and confirm $50 budget is returning ROI",
    ],
    cost:"$0", outcome:"Self-sustaining anonymous income machine. Operational.",
  },
];

const PLATFORMS = [
  { name:"Twitter/X",       icon:"𝕏",  reach:"Very High", bestFor:"AI, Crypto, Finance, Productivity", tool:"Typefully (free)",   status:"go"  },
  { name:"Instagram",       icon:"📸", reach:"High",      bestFor:"Finance, Health, Productivity",     tool:"Later free",         status:"go"  },
  { name:"Newsletter",      icon:"📧", reach:"Owned",     bestFor:"All niches",                        tool:"Beehiiv (free 2.5K)",status:"go"  },
  { name:"Pinterest",       icon:"📌", reach:"Passive",   bestFor:"Finance, Health, Productivity",     tool:"Canva + Tailwind",   status:"go"  },
  { name:"LinkedIn",        icon:"💼", reach:"High (new)",bestFor:"AI Tools, Productivity",            tool:"Buffer free",        status:"opt" },
  { name:"YouTube Shorts",  icon:"▶️", reach:"High",      bestFor:"Finance, Health, AI Tools",        tool:"CapCut free",        status:"opt" },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${n}`;
const pct = (a, b) => b === 0 ? "0%" : `${((a/b)*100).toFixed(0)}%`;

async function callClaudeAPI(apiKey, prompt, niche, contentType) {
  const systemPrompt = `You are a ghost content creator for the "${niche}" niche. You create high-quality, anonymous social media content that drives affiliate clicks and digital product sales. No first person story. Data-driven. Professional tone. No fluff.`;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.error?.message || `API error ${r.status}`);
  }
  const data = await r.json();
  return data.content[0].text;
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
const Stat = ({ label, value, sub, color = G.text }) => (
  <div style={{
    ...sx.card, minWidth: 148,
    borderColor: color + "25",
    boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 30px ${color}10, inset 0 1px 0 rgba(255,255,255,0.04)`,
  }}>
    <div style={{ fontSize: "0.68rem", color: G.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</div>
    <div style={{
      fontSize: "1.9rem", fontWeight: 800, lineHeight: 1.1,
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}>{value}</div>
    {sub && <div style={{ fontSize: "0.7rem", color: G.muted, marginTop: 5 }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color = G.muted }) => (
  <span style={sx.tag(color)}>{text}</span>
);

const SectionHeader = ({ icon, title, sub }) => (
  <div style={{ marginBottom: "1.8rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.1rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}>{icon}</div>
      <h2 style={{
        margin: 0, fontSize: "1.4rem", fontWeight: 800,
        background: "linear-gradient(135deg, #eeeef8 0%, #9090b8 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>{title}</h2>
    </div>
    {sub && <p style={{ margin: 0, color: G.muted, fontSize: "0.83rem", paddingLeft: 50 }}>{sub}</p>}
  </div>
);

// ─── MISSION CONTROL ─────────────────────────────────────────────────────────
function MissionControl({ queue }) {
  const totalExpenses = EXPENSES.reduce((s, e) => s + e.cost, 0);
  const projM6 = REVENUE_DATA[5].total;
  const projM3 = REVENUE_DATA[2].total;

  return (
    <div>
      <SectionHeader icon="👁️" title="Mission Control"
        sub="The anonymous income dashboard. No name. No face. Full control." />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: "1.6rem" }}>
        <Stat label="Month 6 Projection" value={fmt(projM6)} sub="at full scale" color={G.green} />
        <Stat label="Month 3 Target" value={fmt(projM3)} sub="realistic milestone" color={G.gold} />
        <Stat label="Monthly Expenses" value={fmt(totalExpenses)} sub="total cost to run" color={G.blue} />
        <Stat label="Net Margin" value={pct(projM3 - totalExpenses, projM3)} sub="month 3 margin" color={G.purple} />
        <Stat label="Content Queued" value={`${queue.length}`} sub="posts ready to fire" color={G.accent} />
        <Stat label="Time to Launch" value="14 days" sub="from $0 to operational" color={G.text} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ ...sx.card }}>
          <div style={{ fontSize: "0.78rem", color: G.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Revenue Projection — 6 Months
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={G.green} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={G.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
              <XAxis dataKey="month" tick={{ fill: G.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fill: G.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, color: G.text }}
                formatter={(v) => [`$${v.toLocaleString()}`, ""]}
              />
              <Area type="monotone" dataKey="total" stroke={G.green} fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...sx.card }}>
          <div style={{ fontSize: "0.78rem", color: G.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Revenue by Stream — Month 6
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[REVENUE_DATA[5]]} layout="vertical" barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke={G.border} horizontal={false} />
              <XAxis type="number" tickFormatter={v => `$${v/1000}K`} tick={{ fill: G.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="month" tick={{ fill: G.muted, fontSize: 11 }} width={30} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 8, color: G.text }} formatter={v => `$${v.toLocaleString()}`} />
              <Bar dataKey="affiliate"   fill={G.blue}   radius={[0,4,4,0]} name="Affiliate" />
              <Bar dataKey="digital"     fill={G.gold}   radius={[0,4,4,0]} name="Digital Products" />
              <Bar dataKey="newsletter"  fill={G.purple} radius={[0,4,4,0]} name="Newsletter" />
              <Bar dataKey="sponsored"   fill={G.green}  radius={[0,4,4,0]} name="Sponsored" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
            {[["Affiliate",G.blue],["Digital",G.gold],["Newsletter",G.purple],["Sponsored",G.green]].map(([l,c]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.72rem", color: G.muted }}>
                <div style={{ width:8, height:8, borderRadius:2, background:c }} />
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...sx.card }}>
        <div style={{ fontSize: "0.78rem", color: G.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          The Ghost Thesis — Why Anonymous Wins
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            ["No Audience Dependency", "A personal brand is a single point of failure. Anonymous niches survive creator drama, cancellations, and burnout.", G.green],
            ["Infinite Scalability", "Run 5 anonymous accounts in 5 niches. One person = agency-level output. No ego overhead.", G.gold],
            ["Zero Identity Risk", "No doxxing. No reputation damage. Pivot niches instantly. Sell the operation as an asset when you want out.", G.blue],
          ].map(([title, desc, color]) => (
            <div key={title} style={{ background: color + "10", border: `1px solid ${color}30`, borderRadius: 10, padding: "1rem" }}>
              <div style={{ fontWeight: 700, color, marginBottom: 6, fontSize: "0.88rem" }}>{title}</div>
              <div style={{ fontSize: "0.78rem", color: G.muted, lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NICHE INTELLIGENCE ───────────────────────────────────────────────────────
function NicheIntelligence({ selectedNiche, setSelectedNiche }) {
  const [active, setActive] = useState(null);
  const n = active ? NICHES.find(x => x.id === active) : null;

  return (
    <div>
      <SectionHeader icon="🎯" title="Niche Intelligence"
        sub="Pick one. Dominate it. Stay invisible. Profit score = revenue potential ÷ competition × speed." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
        {NICHES.map(niche => (
          <div key={niche.id}
            onClick={() => setActive(active === niche.id ? null : niche.id)}
            style={{
              ...sx.card, cursor: "pointer",
              borderColor: active === niche.id ? G.accent : selectedNiche?.id === niche.id ? G.green : G.border,
              borderWidth: (active === niche.id || selectedNiche?.id === niche.id) ? 2 : 1,
              transition: "all 0.15s",
            }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: "1.8rem" }}>{niche.emoji}</span>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: niche.profitScore >= 90 ? G.green : G.gold }}>{niche.profitScore}</div>
                <div style={{ fontSize: "0.65rem", color: G.muted }}>PROFIT SCORE</div>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: G.text, marginBottom: 4 }}>{niche.name}</div>
            <div style={{ fontSize: "0.75rem", color: G.muted, marginBottom: 10 }}>
              Up to {fmt(niche.monthlyRevPotential)}/mo · {niche.timeToProfit}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
              <Badge text={niche.competition} color={niche.competition === "High" || niche.competition === "Very High" ? G.accent : G.gold} />
              <Badge text={niche.audienceSize} color={G.blue} />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedNiche(niche); }}
              style={{ ...sx.btn(selectedNiche?.id === niche.id ? G.green : G.accent), width:"100%", padding:"0.4rem" }}>
              {selectedNiche?.id === niche.id ? "✓ Selected" : "Select Niche"}
            </button>
          </div>
        ))}
      </div>

      {n && (
        <div style={{ ...sx.card, borderColor: G.accentBorder }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <span style={{ fontSize:"2rem" }}>{n.emoji}</span>
            <div>
              <div style={{ fontWeight:800, fontSize:"1.1rem", color:G.text }}>{n.name}</div>
              <div style={{ fontSize:"0.78rem", color:G.muted }}>Detailed niche breakdown</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <div style={{ fontSize:"0.72rem", color:G.muted, marginBottom:6, textTransform:"uppercase" }}>Why Faceless Works Here</div>
              <div style={{ fontSize:"0.82rem", color:G.text, lineHeight:1.6, marginBottom:14 }}>{n.whyFaceless}</div>
              <div style={{ fontSize:"0.72rem", color:G.muted, marginBottom:6, textTransform:"uppercase" }}>Content Angles</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {n.angles.map(a => <Badge key={a} text={a} color={G.purple} />)}
              </div>
            </div>
            <div>
              <div style={{ fontSize:"0.72rem", color:G.muted, marginBottom:6, textTransform:"uppercase" }}>Monetization Stack</div>
              {n.monetization.map(m => (
                <div key={m} style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:4 }}>
                  <span style={{ color:G.green, fontSize:"0.8rem" }}>→</span>
                  <span style={{ fontSize:"0.8rem", color:G.text }}>{m}</span>
                </div>
              ))}
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:"0.72rem", color:G.muted, marginBottom:6, textTransform:"uppercase" }}>Top Affiliates</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {n.topAffiliates.map(a => <Badge key={a} text={a} color={G.gold} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CONTENT FACTORY ─────────────────────────────────────────────────────────
function ContentFactory({ apiKey, selectedNiche, queue, setQueue }) {
  const [activeTpl, setActiveTpl] = useState(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customNiche, setCustomNiche] = useState("AI Tools");
  const [customType, setCustomType] = useState("Twitter Thread");

  const tpl = activeTpl ? CONTENT_TEMPLATES.find(t => t.id === activeTpl) : null;

  const generate = useCallback(async () => {
    if (!apiKey) { setError("Add your Claude API key in Settings first."); return; }
    const prompt = tpl ? tpl.prompt : customPrompt;
    const niche = tpl ? tpl.niche : customNiche;
    if (!prompt) { setError("Select a template or write a custom prompt."); return; }
    setLoading(true); setError(""); setOutput("");
    try {
      const result = await callClaudeAPI(apiKey, prompt, niche, tpl?.type || customType);
      setOutput(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey, tpl, customPrompt, customNiche, customType]);

  const addToQueue = () => {
    if (!output) return;
    const item = {
      id: Date.now(),
      content: output,
      platform: tpl?.platform || customType,
      niche: tpl?.niche || customNiche,
      status: "queued",
      createdAt: new Date().toLocaleDateString(),
    };
    setQueue(q => [item, ...q]);
    setOutput("");
    setActiveTpl(null);
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <SectionHeader icon="🏭" title="Content Factory"
        sub="AI-generated content at scale. One prompt → publishable post. Powered by Claude API." />

      {!apiKey && (
        <div style={{ background: G.accentDim, border: `1px solid ${G.accentBorder}`, borderRadius:10, padding:"0.9rem 1.1rem", marginBottom:16, fontSize:"0.83rem", color:G.text }}>
          ⚠️ No API key found. Go to <strong>Settings</strong> and add your Claude API key to enable live generation.
          Without a key, you can still view templates and prompts.
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div>
          <div style={{ fontSize:"0.75rem", color:G.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>
            Content Templates
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {CONTENT_TEMPLATES.map(t => (
              <div key={t.id}
                onClick={() => { setActiveTpl(activeTpl === t.id ? null : t.id); setOutput(""); }}
                style={{
                  ...sx.card, cursor:"pointer", padding:"0.9rem 1rem",
                  borderColor: activeTpl === t.id ? G.accent : G.border,
                  borderWidth: activeTpl === t.id ? 2 : 1,
                }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <div style={{ fontWeight:700, fontSize:"0.85rem", color:G.text }}>{t.title}</div>
                  <div style={{ display:"flex", gap:5 }}>
                    <Badge text={t.platform} color={G.blue} />
                    <Badge text={t.type} color={G.purple} />
                  </div>
                </div>
                <div style={{ fontSize:"0.72rem", color:G.gold }}>💰 {t.monetization}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:"0.75rem", color:G.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>
              Custom Generation
            </div>
            <div style={{ ...sx.card }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:"0.72rem", color:G.muted, marginBottom:4 }}>Niche</div>
                  <select value={customNiche} onChange={e => setCustomNiche(e.target.value)} style={{ ...sx.select, width:"100%" }}>
                    {NICHES.map(n => <option key={n.id}>{n.name.split(" ")[0] === "Faceless" ? "Finance" : n.name.replace(" Ghost","").replace(" Daily","").replace(" Data Feed","").replace(" Data Lab","")}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:"0.72rem", color:G.muted, marginBottom:4 }}>Format</div>
                  <select value={customType} onChange={e => setCustomType(e.target.value)} style={{ ...sx.select, width:"100%" }}>
                    {["Twitter Thread","Instagram Carousel","Single Post","Newsletter Issue","YouTube Script","Pinterest Description"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                onClick={() => setActiveTpl(null)}
                placeholder="Describe what you want generated: topic, angle, CTA, tone..."
                style={{ ...sx.input, minHeight:90, resize:"vertical", fontFamily:"inherit" }}
              />
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize:"0.75rem", color:G.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>
            {tpl ? `Prompt: ${tpl.title}` : "Output"}
          </div>

          {tpl && (
            <div style={{ ...sx.card, marginBottom:8, background: G.goldDim, borderColor: G.goldBorder }}>
              <div style={{ fontSize:"0.72rem", color:G.muted, marginBottom:4 }}>AI Prompt</div>
              <div style={{ fontSize:"0.78rem", color:G.text, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{tpl.prompt}</div>
            </div>
          )}

          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <button onClick={generate} disabled={loading}
              style={{ ...sx.btn(loading ? G.muted : G.accent), flex:1, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Generating..." : "⚡ Generate with Claude"}
            </button>
            {output && <>
              <button onClick={copy} style={sx.btnGhost}>{copied ? "✓" : "Copy"}</button>
              <button onClick={addToQueue} style={{ ...sx.btn(G.green) }}>+ Queue</button>
            </>}
          </div>

          {error && (
            <div style={{ background:G.accentDim, border:`1px solid ${G.accentBorder}`, borderRadius:8, padding:"0.7rem 1rem", marginBottom:8, fontSize:"0.8rem", color:G.accent }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ ...sx.card, textAlign:"center", padding:"2rem", color:G.muted, fontSize:"0.85rem" }}>
              <div style={{ fontSize:"1.5rem", marginBottom:8 }}>🤖</div>
              Claude is writing your content...
            </div>
          )}

          {output && !loading && (
            <div style={{ ...sx.card, borderColor: G.greenBorder, background: G.greenDim }}>
              <div style={{ fontSize:"0.72rem", color:G.green, marginBottom:8, textTransform:"uppercase" }}>Generated Content — Ready to Publish</div>
              <div style={{ fontSize:"0.83rem", color:G.text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{output}</div>
            </div>
          )}

          {queue.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:"0.75rem", color:G.muted, marginBottom:8, textTransform:"uppercase" }}>
                Publishing Queue ({queue.length} posts)
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {queue.slice(0,5).map(item => (
                  <div key={item.id} style={{ ...sx.card, padding:"0.7rem 1rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ display:"flex", gap:6, marginBottom:4 }}>
                        <Badge text={item.platform} color={G.blue} />
                        <Badge text={item.niche} color={G.purple} />
                        <Badge text={item.status} color={G.green} />
                      </div>
                      <div style={{ fontSize:"0.75rem", color:G.muted, maxWidth:300 }}>
                        {item.content.slice(0,80)}...
                      </div>
                    </div>
                    <button onClick={() => setQueue(q => q.filter(x => x.id !== item.id))}
                      style={{ ...sx.btnGhost, padding:"0.25rem 0.6rem", fontSize:"0.7rem" }}>✕</button>
                  </div>
                ))}
                {queue.length > 5 && <div style={{ fontSize:"0.75rem", color:G.muted, textAlign:"center" }}>+{queue.length-5} more in queue</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MONETIZATION HUB ────────────────────────────────────────────────────────
function MonetizationHub() {
  const [tab, setTab] = useState("affiliates");

  return (
    <div>
      <SectionHeader icon="💸" title="Monetization Hub"
        sub="Three revenue streams. All anonymous. Stack them from day 1." />

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[["affiliates","Affiliate Programs"],["products","Digital Products"],["newsletter","Newsletter Revenue"]].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ ...( tab === key ? sx.btn(G.accent) : sx.btnGhost ), borderRadius:8 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "affiliates" && (
        <div>
          <div style={{ ...sx.card, marginBottom:12, background:G.goldDim, borderColor:G.goldBorder }}>
            <div style={{ fontSize:"0.82rem", color:G.text, lineHeight:1.6 }}>
              <strong style={{ color:G.gold }}>Ghost Affiliate Strategy:</strong> Apply to gold-tier programs first (recurring commissions).
              One SaaS affiliate at 45% recurring can generate $2K+/month at 40 active referrals.
              Anonymous accounts can be approved — never disclose traffic sources, just show audience engagement.
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:10 }}>
            {AFFILIATES.map(a => (
              <div key={a.id} style={{ ...sx.card, borderColor: a.tier === "gold" ? G.goldBorder : a.tier === "silver" ? G.border2 : G.border }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:"0.9rem", color:G.text }}>{a.name}</div>
                    <Badge text={a.cat} color={G.blue} />
                  </div>
                  <Badge
                    text={a.tier.toUpperCase()}
                    color={a.tier === "gold" ? G.gold : a.tier === "silver" ? G.blue : G.muted}
                  />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {[["Commission",a.commission,G.green],["Avg EPC",a.epc,G.gold],["Cookie",a.cookie,G.blue],["Min Payout",a.payout,G.purple]].map(([l,v,c]) => (
                    <div key={l} style={{ background:G.dim, borderRadius:6, padding:"0.35rem 0.6rem" }}>
                      <div style={{ fontSize:"0.65rem", color:G.muted }}>{l}</div>
                      <div style={{ fontSize:"0.8rem", fontWeight:700, color:c }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "products" && (
        <div>
          <div style={{ ...sx.card, marginBottom:12, background:G.blueDim, borderColor:G.blue+"40" }}>
            <div style={{ fontSize:"0.82rem", color:G.text, lineHeight:1.6 }}>
              <strong style={{ color:G.blue }}>Ghost Product Strategy:</strong> Create once, sell forever.
              AI-assisted products take 2–5 hours to create. At $27–$57/item with 100–200 monthly sales,
              a single product generates $3K–$10K/month with zero ongoing effort. Use Claude API to create the content.
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {PRODUCTS.map(p => (
              <div key={p.id} style={{ ...sx.card, display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", alignItems:"center", gap:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:"0.88rem", color:G.text }}>{p.name}</div>
                  <div style={{ fontSize:"0.72rem", color:G.muted }}>{p.format} · {p.platform} · {p.timeToCreate}</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"1.2rem", fontWeight:800, color:G.gold }}>${p.price}</div>
                  <div style={{ fontSize:"0.65rem", color:G.muted }}>price point</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"0.9rem", fontWeight:700, color:G.text }}>{p.revTarget}</div>
                  <div style={{ fontSize:"0.65rem", color:G.muted }}>sales target</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"1.1rem", fontWeight:800, color:G.green }}>{fmt(p.price * p.revTarget * 0.9)}</div>
                  <div style={{ fontSize:"0.65rem", color:G.muted }}>rev/month</div>
                </div>
                <Badge text={p.niche} color={G.purple} />
              </div>
            ))}
          </div>
          <div style={{ ...sx.card, marginTop:12, background:G.greenDim, borderColor:G.greenBorder }}>
            <div style={{ fontWeight:700, color:G.green, marginBottom:6 }}>Total Digital Product Revenue (all 5)</div>
            <div style={{ fontSize:"1.8rem", fontWeight:800, color:G.text }}>
              {fmt(PRODUCTS.reduce((s,p) => s + p.price * p.revTarget * 0.9, 0))}
              <span style={{ fontSize:"0.9rem", color:G.muted, fontWeight:400 }}>/month at scale</span>
            </div>
          </div>
        </div>
      )}

      {tab === "newsletter" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div style={{ ...sx.card }}>
              <div style={{ fontWeight:700, color:G.text, marginBottom:12 }}>Newsletter Revenue Model</div>
              {[
                ["Beehiiv Boost (referrals)", "$0.50–$2/subscriber", G.green, "Beehiiv pays you to grow your list"],
                ["Sponsored issues", "$50–$500/issue", G.gold, "1,000 subs = $50-$100/issue. 10,000 subs = $500+"],
                ["Affiliate placements", "30–45% commission", G.blue, "Recommend tools directly in your email digest"],
                ["Premium tier", "$9–$29/month", G.purple, "Unlock exclusive data, templates, or deep dives"],
              ].map(([label, value, color, desc]) => (
                <div key={label} style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:8, marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${G.border}` }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:"0.85rem", color:G.text }}>{label}</div>
                    <div style={{ fontSize:"0.72rem", color:G.muted }}>{desc}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:700, color, fontSize:"0.85rem" }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...sx.card }}>
              <div style={{ fontWeight:700, color:G.text, marginBottom:12 }}>Newsletter Revenue by Subscriber Count</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { subs:"500", rev:150 }, { subs:"1K", rev:400 }, { subs:"2.5K", rev:900 },
                  { subs:"5K", rev:2200 }, { subs:"10K", rev:5500 }, { subs:"25K", rev:14000 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={G.border} />
                  <XAxis dataKey="subs" tick={{ fill:G.muted, fontSize:11 }} axisLine={false} tickLine={false} label={{ value:"Subscribers", position:"insideBottom", offset:-2, fill:G.muted, fontSize:10 }} />
                  <YAxis tickFormatter={v=>`$${v/1000}K`} tick={{ fill:G.muted, fontSize:11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:8, color:G.text }} formatter={v=>`$${v}/mo`} />
                  <Bar dataKey="rev" fill={G.purple} radius={[4,4,0,0]} name="Est. Monthly Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BLUEPRINT ────────────────────────────────────────────────────────────────
function Blueprint() {
  const [expanded, setExpanded] = useState(null);
  const totalCost = EXPENSES.reduce((s,e) => s + e.cost, 0);

  return (
    <div>
      <SectionHeader icon="🗺️" title="14-Day Blueprint"
        sub="$50 budget. Zero identity. Operational ghost machine by Day 14." />

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:16 }}>
        <div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ROADMAP.map((step, i) => (
              <div key={i}>
                <div
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{
                    ...sx.card, cursor:"pointer",
                    borderColor: expanded === i ? step.color : G.border,
                    borderWidth: expanded === i ? 2 : 1,
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                  }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ background:step.color+"20", border:`1px solid ${step.color}50`, borderRadius:8, padding:"0.3rem 0.7rem", fontSize:"0.72rem", fontWeight:700, color:step.color, whiteSpace:"nowrap" }}>
                      {step.day}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:"0.9rem", color:G.text }}>{step.phase}</div>
                      <div style={{ fontSize:"0.72rem", color:G.muted }}>{step.cost} budget · {step.tasks.length} tasks</div>
                    </div>
                  </div>
                  <span style={{ color:G.muted, fontSize:"0.8rem" }}>{expanded === i ? "▲" : "▼"}</span>
                </div>
                {expanded === i && (
                  <div style={{ background:step.color+"08", border:`1px solid ${step.color}25`, borderRadius:"0 0 10px 10px", padding:"1rem 1.2rem", marginTop:-2 }}>
                    <div style={{ marginBottom:10 }}>
                      {step.tasks.map((task, j) => (
                        <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                          <span style={{ color:step.color, marginTop:2, fontSize:"0.75rem" }}>✓</span>
                          <span style={{ fontSize:"0.82rem", color:G.text, lineHeight:1.5 }}>{task}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background:step.color+"15", border:`1px solid ${step.color}30`, borderRadius:8, padding:"0.5rem 0.8rem", fontSize:"0.78rem", color:step.color }}>
                      <strong>Outcome:</strong> {step.outcome}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ ...sx.card, marginBottom:12 }}>
            <div style={{ fontSize:"0.75rem", color:G.muted, marginBottom:10, textTransform:"uppercase" }}>Monthly Expenses Breakdown</div>
            {EXPENSES.map((e, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, paddingBottom:8, borderBottom: i < EXPENSES.length-1 ? `1px solid ${G.border}` : "none" }}>
                <div>
                  <div style={{ fontSize:"0.8rem", color:G.text }}>{e.name}</div>
                  {e.note && <div style={{ fontSize:"0.65rem", color:G.muted }}>{e.note}</div>}
                </div>
                <div style={{ fontWeight:700, color: e.cost === 0 ? G.green : G.gold, fontSize:"0.85rem", whiteSpace:"nowrap", marginLeft:8 }}>
                  {e.cost === 0 ? "FREE" : `$${e.cost}`}
                </div>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:`1px solid ${G.gold}40` }}>
              <div style={{ fontWeight:700, color:G.text }}>Total Monthly</div>
              <div style={{ fontWeight:800, color:G.gold, fontSize:"1.1rem" }}>${totalCost}</div>
            </div>
          </div>

          <div style={{ ...sx.card, background:G.greenDim, borderColor:G.greenBorder }}>
            <div style={{ fontSize:"0.75rem", color:G.green, marginBottom:8, textTransform:"uppercase" }}>Month 3 P&L</div>
            {[
              ["Revenue (conservative)", "$5,800", G.green],
              ["Monthly Expenses", `-$${totalCost}`, G.accent],
              ["Gumroad Fees (~10%)", "-$300", G.accent],
              ["Net Profit", "$5,450", G.gold],
            ].map(([label, value, color]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:"0.8rem", color:G.muted }}>{label}</span>
                <span style={{ fontWeight:700, color, fontSize:"0.85rem" }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ ...sx.card, marginTop:12, background:G.accentDim, borderColor:G.accentBorder }}>
            <div style={{ fontSize:"0.75rem", color:G.accent, marginBottom:6, textTransform:"uppercase" }}>Critical Rules</div>
            {[
              "Never use your real name on any account",
              "Separate browser profiles per account",
              "Never link accounts to your personal email",
              "VPN always on — consistent exit node per account",
              "Gumroad payouts to anonymous PayPal or crypto",
            ].map((rule, i) => (
              <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:4 }}>
                <span style={{ color:G.accent, fontSize:"0.75rem" }}>⚡</span>
                <span style={{ fontSize:"0.77rem", color:G.text, lineHeight:1.5 }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PLATFORMS ────────────────────────────────────────────────────────────────
function PlatformEngine() {
  return (
    <div>
      <SectionHeader icon="📡" title="Platform Engine"
        sub="Anonymous account setup guide. Each platform. Free tools only." />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:12 }}>
        {PLATFORMS.map(p => (
          <div key={p.name} style={{ ...sx.card, borderColor: p.status === "go" ? G.greenBorder : G.border }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:"1.4rem" }}>{p.icon}</span>
                <div style={{ fontWeight:700, fontSize:"0.95rem", color:G.text }}>{p.name}</div>
              </div>
              <Badge text={p.status === "go" ? "PRIORITY" : "OPTIONAL"} color={p.status === "go" ? G.green : G.muted} />
            </div>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:"0.65rem", color:G.muted, marginBottom:3 }}>ORGANIC REACH</div>
              <Badge text={p.reach} color={G.blue} />
            </div>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:"0.65rem", color:G.muted, marginBottom:3 }}>BEST NICHES</div>
              <div style={{ fontSize:"0.78rem", color:G.text }}>{p.bestFor}</div>
            </div>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:"0.65rem", color:G.muted, marginBottom:3 }}>FREE TOOL</div>
              <div style={{ fontSize:"0.78rem", color:G.gold }}>{p.tool}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...sx.card, marginTop:16 }}>
        <div style={{ fontWeight:700, color:G.text, marginBottom:12 }}>Anonymous Account Creation Protocol</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12 }}>
          {[
            ["Before Creating", [
              "VPN active — consistent exit node",
              "Fresh browser profile (GoLogin/Multilogin)",
              "Anonymous ProtonMail ready",
              "Niche name picked — no personal words",
              "Profile image: AI-generated avatar or logo",
            ], G.blue],
            ["Account Setup", [
              "Username: [NicheKeyword][Topic] format",
              "Bio: value proposition only, no personal story",
              "Profile photo: AI avatar, chart, or abstract logo",
              "Website: Gumroad store or Beehiiv newsletter",
              "Never connect to personal accounts",
            ], G.gold],
            ["Ongoing OPSEC", [
              "Never post from personal device without VPN",
              "Don't cross-mention between your accounts",
              "Separate payment methods per property",
              "Review privacy settings monthly",
              "Content scheduled in advance — minimize live logins",
            ], G.green],
          ].map(([title, items, color]) => (
            <div key={title} style={{ background: color+"10", border:`1px solid ${color}30`, borderRadius:10, padding:"1rem" }}>
              <div style={{ fontWeight:700, color, marginBottom:8, fontSize:"0.85rem" }}>{title}</div>
              {items.map((item,i) => (
                <div key={i} style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:5 }}>
                  <span style={{ color, fontSize:"0.7rem", marginTop:2 }}>→</span>
                  <span style={{ fontSize:"0.77rem", color:G.text, lineHeight:1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function GhostSettings({ apiKey, setApiKey }) {
  const [draft, setDraft] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setApiKey(draft);
    localStorage.setItem("ghost_claude_key", draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <SectionHeader icon="⚙️" title="Settings"
        sub="API keys and operational configuration. Stored locally in your browser only." />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ ...sx.card }}>
          <div style={{ fontWeight:700, color:G.text, marginBottom:4 }}>Claude API Key</div>
          <div style={{ fontSize:"0.78rem", color:G.muted, marginBottom:12, lineHeight:1.5 }}>
            Used exclusively for content generation in the Content Factory.
            Stored in localStorage — never sent anywhere except Anthropic's API.
            Get yours at <span style={{ color:G.blue }}>console.anthropic.com</span>.
          </div>
          <input
            type="password"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="sk-ant-api03-..."
            style={{ ...sx.input, marginBottom:10, fontFamily:"monospace" }}
          />
          <div style={{ fontSize:"0.72rem", color:G.muted, marginBottom:10 }}>
            Recommended model: <strong style={{ color:G.gold }}>claude-haiku-4-5-20251001</strong> — fastest, cheapest ($0.25/$1.25 per MTok).
            Budget: $20/month generates ~150K tokens = ~300–500 content pieces.
          </div>
          <button onClick={save} style={{ ...sx.btn(saved ? G.green : G.accent) }}>
            {saved ? "✓ Saved" : "Save API Key"}
          </button>
        </div>

        <div style={{ ...sx.card }}>
          <div style={{ fontWeight:700, color:G.text, marginBottom:12 }}>Recommended Tool Stack (Free)</div>
          {[
            { tool:"Beehiiv",     purpose:"Newsletter platform",      cost:"Free (2.5K subs)", url:"beehiiv.com" },
            { tool:"Gumroad",     purpose:"Digital product sales",    cost:"10% fee, no monthly", url:"gumroad.com" },
            { tool:"Canva",       purpose:"Visual content creation",  cost:"Free tier", url:"canva.com" },
            { tool:"Buffer",      purpose:"Social scheduling",        cost:"Free (3 channels)", url:"buffer.com" },
            { tool:"Typefully",   purpose:"Twitter thread scheduling",cost:"Free tier", url:"typefully.com" },
            { tool:"ProtonMail",  purpose:"Anonymous email",          cost:"Free tier", url:"proton.me" },
            { tool:"Mullvad VPN", purpose:"Operational security",     cost:"$5/month", url:"mullvad.net" },
          ].map(t => (
            <div key={t.tool} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, paddingBottom:8, borderBottom:`1px solid ${G.border}` }}>
              <div>
                <div style={{ fontWeight:600, fontSize:"0.85rem", color:G.text }}>{t.tool}</div>
                <div style={{ fontSize:"0.72rem", color:G.muted }}>{t.purpose}</div>
              </div>
              <Badge text={t.cost} color={t.cost.startsWith("Free") ? G.green : G.gold} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...sx.card, marginTop:16, background:G.accentDim, borderColor:G.accentBorder }}>
        <div style={{ fontWeight:700, color:G.accent, marginBottom:8 }}>Important: Browser-Side API Calls</div>
        <div style={{ fontSize:"0.82rem", color:G.text, lineHeight:1.6 }}>
          This dashboard makes Claude API calls directly from your browser. Your API key is stored in localStorage
          and sent only to <code style={{ color:G.gold }}>api.anthropic.com</code>. For a production operation,
          wrap this in a simple serverless function (Cloudflare Workers or Vercel Edge Function — both free tier)
          to keep your API key server-side. This adds 30 minutes of setup and eliminates any key exposure risk.
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
const NAV = [
  { id:"mission",      label:"Mission Control",    icon:"👁️"  },
  { id:"niche",        label:"Niche Intelligence",  icon:"🎯"  },
  { id:"content",      label:"Content Factory",     icon:"🏭"  },
  { id:"monetization", label:"Monetization Hub",    icon:"💸"  },
  { id:"blueprint",    label:"14-Day Blueprint",    icon:"🗺️"  },
  { id:"platforms",    label:"Platform Engine",     icon:"📡"  },
  { id:"settings",     label:"Settings",            icon:"⚙️"  },
];

export default function GhostOpDashboard() {
  const [section, setSection] = useState("mission");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("ghost_claude_key") || "");
  const [selectedNiche, setSelectedNiche] = useState(NICHES[0]);
  const [queue, setQueue] = useState([]);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:G.bg, color:G.text, fontFamily:'"Inter","Segoe UI",system-ui,sans-serif', position:"relative", overflow:"hidden" }}>

      {/* ── Global CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        input:focus, select:focus, textarea:focus { outline: none !important; border-color: rgba(230,57,70,0.5) !important; box-shadow: 0 0 0 3px rgba(230,57,70,0.1) !important; }
        button:active { transform: scale(0.97) !important; }

        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(60px,-80px) scale(1.08); }
          66%      { transform: translate(-40px,50px) scale(0.94); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-70px,60px) scale(1.06); }
          66%      { transform: translate(50px,-40px) scale(0.96); }
        }
        @keyframes orb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(40px,60px) scale(1.04); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 20px rgba(230,57,70,0.3); }
          50%      { box-shadow: 0 0 40px rgba(230,57,70,0.6); }
        }
        @keyframes shimmer {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        .ghost-nav-btn:hover { background: rgba(255,255,255,0.05) !important; color: #eeeef8 !important; }
        .ghost-card:hover { border-color: rgba(255,255,255,0.12) !important; box-shadow: 0 12px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06) !important; transform: translateY(-1px); }
        .ghost-btn-primary:hover { box-shadow: 0 0 35px rgba(230,57,70,0.6) !important; transform: translateY(-1px); }
      `}</style>

      {/* ── Floating Orbs Background ── */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(230,57,70,0.12) 0%, transparent 65%)", top:"-250px", left:"-150px", animation:"orb1 28s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 65%)", bottom:"-200px", right:"-100px", animation:"orb2 35s ease-in-out infinite" }} />
        <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(240,192,64,0.07) 0%, transparent 65%)", top:"40%", left:"35%", animation:"orb3 22s ease-in-out infinite 4s" }} />
        <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 65%)", top:"10%", right:"15%", animation:"orb1 32s ease-in-out infinite 8s" }} />
        {/* subtle grid overlay */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      {/* ── Sidebar ── */}
      <div style={{ width:230, display:"flex", flexDirection:"column", flexShrink:0, position:"relative", zIndex:10, ...GLASS, borderRight:"1px solid rgba(255,255,255,0.06)", borderRadius:0 }}>

        {/* Logo */}
        <div style={{ padding:"1.8rem 1.4rem 1.2rem", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{
              width:36, height:36, borderRadius:10,
              background:"linear-gradient(135deg, #e63946, #c0202e)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1rem", fontWeight:900, color:"#fff",
              boxShadow:"0 0 24px rgba(230,57,70,0.5)",
              animation:"glowPulse 3s ease-in-out infinite",
            }}>G</div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"1.05rem", color:G.text, lineHeight:1, letterSpacing:"0.02em" }}>Ghost Op</div>
              <div style={{ fontSize:"0.58rem", color:G.muted, letterSpacing:"0.14em", marginTop:2 }}>ANONYMOUS INCOME</div>
            </div>
          </div>
          {apiKey && (
            <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:8, padding:"0.3rem 0.65rem", fontSize:"0.65rem", color:G.green, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:G.green, display:"inline-block", boxShadow:"0 0 6px #22c55e" }} />
              Claude API connected
            </div>
          )}
          {selectedNiche && (
            <div style={{ background:"rgba(240,192,64,0.08)", border:"1px solid rgba(240,192,64,0.2)", borderRadius:8, padding:"0.28rem 0.65rem", fontSize:"0.65rem", color:G.gold, marginTop:6 }}>
              {selectedNiche.emoji} {selectedNiche.name}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"0.8rem 0.6rem" }}>
          {NAV.map(n => {
            const active = section === n.id;
            return (
              <button key={n.id} onClick={() => setSection(n.id)} className="ghost-nav-btn"
                style={{
                  display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"0.7rem 0.9rem", marginBottom:2,
                  background: active ? "rgba(230,57,70,0.12)" : "transparent",
                  border: active ? "1px solid rgba(230,57,70,0.25)" : "1px solid transparent",
                  borderRadius:10,
                  color: active ? G.text : G.muted,
                  cursor:"pointer", fontSize:"0.83rem", fontWeight: active ? 700 : 400,
                  transition:"all 0.18s", textAlign:"left",
                  boxShadow: active ? "0 0 20px rgba(230,57,70,0.1)" : "none",
                }}>
                <span style={{ fontSize:"0.95rem", width:20, textAlign:"center" }}>{n.icon}</span>
                {n.label}
                {active && <span style={{ marginLeft:"auto", width:5, height:5, borderRadius:"50%", background:G.accent, boxShadow:"0 0 8px #e63946" }} />}
              </button>
            );
          })}
        </nav>

        <div style={{ padding:"1rem 1.4rem", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize:"0.6rem", color:G.muted, lineHeight:1.7, letterSpacing:"0.04em" }}>
            GHOST OPERATION v1.0<br/>
            <span style={{ color:"rgba(255,255,255,0.15)" }}>All data stored locally.</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex:1, padding:"2.5rem", overflow:"auto", position:"relative", zIndex:5 }}>
        <div style={{ animation:"fadeUp 0.4s ease", maxWidth:1200 }} key={section}>
          {section === "mission"      && <MissionControl queue={queue} />}
          {section === "niche"        && <NicheIntelligence selectedNiche={selectedNiche} setSelectedNiche={setSelectedNiche} />}
          {section === "content"      && <ContentFactory apiKey={apiKey} selectedNiche={selectedNiche} queue={queue} setQueue={setQueue} />}
          {section === "monetization" && <MonetizationHub />}
          {section === "blueprint"    && <Blueprint />}
          {section === "platforms"    && <PlatformEngine />}
          {section === "settings"     && <GhostSettings apiKey={apiKey} setApiKey={setApiKey} />}
        </div>
      </div>
    </div>
  );
}
