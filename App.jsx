import { useState, useReducer, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── DATA ───────────────────────────────────────────────────────────────────
const USERS = [
  { id: 1, name: "Admin", username: "admin", password: "1234", role: "admin" },
  { id: 2, name: "Kasieria", username: "kasier", password: "0000", role: "cashier" },
];

const INIT_PRODUCTS = [
  { id: 1, name: "Kafe Espresso", category: "Ushqim", price: 150, stock: 45, minStock: 10, barcode: "1001", unit: "copë" },
  { id: 2, name: "Ujë Mineral 0.5L", category: "Pije", price: 80, stock: 3, minStock: 20, barcode: "1002", unit: "shishe" },
  { id: 3, name: "Çokollatë Milka", category: "Ushqim", price: 250, stock: 18, minStock: 5, barcode: "1003", unit: "copë" },
  { id: 4, name: "Shampoo Pantene", category: "Kozmetikë", price: 680, stock: 8, minStock: 3, barcode: "1004", unit: "shishe" },
  { id: 5, name: "Bukë e Zezë", category: "Ushqim", price: 120, stock: 22, minStock: 8, barcode: "1005", unit: "copë" },
  { id: 6, name: "Qumësht 1L", category: "Bulmet", price: 160, stock: 12, minStock: 10, barcode: "1006", unit: "paketë" },
  { id: 7, name: "Djathë i Bardhë", category: "Bulmet", price: 320, stock: 6, minStock: 4, barcode: "1007", unit: "kg" },
  { id: 8, name: "Lëng Portokalli", category: "Pije", price: 200, stock: 15, minStock: 8, barcode: "1008", unit: "shishe" },
];

const INIT_SALES = [
  { id: 1, date: "2025-05-24", items: [{name:"Kafe",qty:3,price:150},{name:"Ujë",qty:2,price:80}], total: 610, cashier: "Admin" },
  { id: 2, date: "2025-05-25", items: [{name:"Bukë",qty:5,price:120},{name:"Qumësht",qty:2,price:160}], total: 920, cashier: "Kasieria" },
  { id: 3, date: "2025-05-26", items: [{name:"Çokollatë",qty:4,price:250},{name:"Lëng",qty:3,price:200}], total: 1600, cashier: "Admin" },
  { id: 4, date: "2025-05-27", items: [{name:"Djathë",qty:2,price:320},{name:"Bukë",qty:3,price:120}], total: 1000, cashier: "Kasieria" },
  { id: 5, date: "2025-05-28", items: [{name:"Shampoo",qty:1,price:680},{name:"Ujë",qty:5,price:80}], total: 1080, cashier: "Admin" },
  { id: 6, date: "2025-05-29", items: [{name:"Kafe",qty:8,price:150},{name:"Çokollatë",qty:3,price:250}], total: 1950, cashier: "Kasieria" },
  { id: 7, date: "2025-05-30", items: [{name:"Lëng",qty:4,price:200},{name:"Qumësht",qty:3,price:160}], total: 1280, cashier: "Admin" },
];

const CATEGORIES = ["Të gjitha", "Ushqim", "Pije", "Bulmet", "Kozmetikë", "Tjetër"];

function productsReducer(state, action) {
  switch (action.type) {
    case "ADD": return [...state, { ...action.p, id: Date.now() }];
    case "UPDATE": return state.map(p => p.id === action.id ? { ...p, ...action.data } : p);
    case "DELETE": return state.filter(p => p.id !== action.id);
    case "RESTOCK": return state.map(p => p.id === action.id ? { ...p, stock: p.stock + +action.qty } : p);
    case "SELL": return state.map(p => {
      const item = action.items.find(i => i.id === p.id);
      return item ? { ...p, stock: p.stock - item.qty } : p;
    });
    default: return state;
  }
}

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#080810", card: "#0f0f1c", border: "#1c1c30",
  accent: "#f0c040", accentDim: "#f0c04018", accentBorder: "#f0c04040",
  green: "#34d399", greenDim: "#34d39918", red: "#f87171", redDim: "#f8717118",
  blue: "#60a5fa", blueDim: "#60a5fa18", text: "#e8e8f0", muted: "#6b6b85", dim: "#2a2a40"
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  const bg = type === "error" ? C.red : type === "warn" ? "#f59e0b" : C.green;
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:9999, background:bg, color:"#000",
      padding:"0.7rem 1.4rem", borderRadius:10, fontWeight:700, fontSize:"0.88rem",
      boxShadow:"0 8px 30px rgba(0,0,0,0.5)", animation:"slideIn 0.3s ease" }}>
      {msg}
    </div>
  );
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("admin");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const handle = () => {
    const found = USERS.find(u => u.username === user && u.password === pass);
    if (found) onLogin(found);
    else { setErr("Emri ose fjalëkalimi gabim!"); setTimeout(() => setErr(""), 2000); }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap');
        @keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
        @keyframes fadeUp{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
        input:focus{outline:none!important;border-color:#f0c040!important;}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#0f0f1c} ::-webkit-scrollbar-thumb{background:#2a2a40;border-radius:3px}
      `}</style>
      <div style={{ width:380, animation:"fadeUp 0.5s ease" }}>
        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:8 }}>◈</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem", color:C.accent, fontWeight:800, letterSpacing:"0.05em" }}>RetailOS</div>
          <div style={{ color:C.muted, fontSize:"0.85rem", marginTop:4 }}>Sistemi i menaxhimit të dyqanit</div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"2rem" }}>
          <div style={{ marginBottom:"1.25rem" }}>
            <label style={{ display:"block", color:C.muted, fontSize:"0.75rem", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Emri i përdoruesit</label>
            <input value={user} onChange={e=>setUser(e.target.value)}
              style={{ width:"100%", background:"#080810", border:`1px solid ${C.dim}`, borderRadius:8, padding:"0.65rem 0.85rem", color:C.text, fontSize:"0.9rem", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:"1.5rem" }}>
            <label style={{ display:"block", color:C.muted, fontSize:"0.75rem", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Fjalëkalimi</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}
              style={{ width:"100%", background:"#080810", border:`1px solid ${C.dim}`, borderRadius:8, padding:"0.65rem 0.85rem", color:C.text, fontSize:"0.9rem", boxSizing:"border-box" }} />
          </div>
          {err && <div style={{ color:C.red, fontSize:"0.82rem", marginBottom:"1rem", textAlign:"center" }}>{err}</div>}
          <button onClick={handle} style={{ width:"100%", background:C.accent, border:"none", borderRadius:8, padding:"0.75rem", color:"#000", fontWeight:700, fontSize:"1rem", cursor:"pointer" }}>
            Hyr në sistem →
          </button>
          <div style={{ marginTop:"1.25rem", background:C.bg, borderRadius:8, padding:"0.75rem", fontSize:"0.78rem", color:C.muted, lineHeight:1.7 }}>
            <strong style={{color:C.text}}>Demo:</strong><br/>
            Admin: <code style={{color:C.accent}}>admin / 1234</code><br/>
            Kasier: <code style={{color:C.accent}}>kasier / 0000</code>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("kasa");
  const [products, dispatch] = useReducer(productsReducer, INIT_PRODUCTS);
  const [sales, setSales] = useState(INIT_SALES);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Të gjitha");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // {type, data}
  const [form, setForm] = useState({});
  const [paid, setPaid] = useState("");
  const [receiptSale, setReceiptSale] = useState(null);

  const showToast = (msg, type="success") => setToast({msg,type});

  if (!user) return <LoginScreen onLogin={u=>{setUser(u); setView(u.role==="cashier"?"kasa":"kasa");}} />;

  const isAdmin = user.role === "admin";
  const cartTotal = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const change = paid ? Math.max(0, +paid - cartTotal) : 0;

  // Cart ops
  const addToCart = (p) => {
    if (p.stock <= 0) return showToast("Produkti nuk ka stok!", "error");
    setCart(c => {
      const ex = c.find(i=>i.id===p.id);
      if (ex) {
        if (ex.qty >= p.stock) return showToast("Stoku i pamjaftueshëm!", "error") || c;
        return c.map(i=>i.id===p.id ? {...i,qty:i.qty+1} : i);
      }
      return [...c, {...p, qty:1}];
    });
  };
  const removeFromCart = (id) => setCart(c=>c.filter(i=>i.id!==id));
  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    const p = products.find(p=>p.id===id);
    if (qty > p.stock) return showToast("Stoku i pamjaftueshëm!","error");
    setCart(c=>c.map(i=>i.id===id?{...i,qty}:i));
  };

  const completeSale = () => {
    if (cart.length===0) return showToast("Shporta është bosh!","error");
    if (+paid < cartTotal) return showToast("Pagesa e pamjaftueshme!","error");
    const sale = { id:Date.now(), date:new Date().toISOString().split("T")[0], items:cart.map(i=>({name:i.name,qty:i.qty,price:i.price})), total:cartTotal, cashier:user.name };
    setSales(s=>[...s,sale]);
    dispatch({type:"SELL", items:cart});
    setReceiptSale({...sale, paid:+paid, change});
    setCart([]);
    setPaid("");
    showToast("Shitja u regjistrua! ✓");
  };

  // Products
  const filteredProds = products.filter(p => {
    const ms = search.toLowerCase();
    return (p.name.toLowerCase().includes(ms) || p.barcode.includes(ms)) &&
           (catFilter==="Të gjitha" || p.category===catFilter);
  });

  const lowStock = products.filter(p=>p.stock>0 && p.stock<=p.minStock);
  const outStock = products.filter(p=>p.stock===0);

  // Reports
  const salesByDay = INIT_SALES.map(s=>({day:s.date.slice(5), total:s.total}));
  const topProducts = (() => {
    const map = {};
    sales.forEach(s=>s.items.forEach(i=>{map[i.name]=(map[i.name]||0)+i.qty*i.price;}));
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,val])=>({name,val}));
  })();
  const totalRevenue = sales.reduce((s,i)=>s+i.total,0);
  const todaySales = sales.filter(s=>s.date===new Date().toISOString().split("T")[0]);
  const todayRevenue = todaySales.reduce((s,i)=>s+i.total,0);

  const stockColor = (p) => p.stock===0 ? C.red : p.stock<=p.minStock ? "#f59e0b" : C.green;

  const NAV = [
    {id:"kasa", label:"Kasa", icon:"⊡"},
    ...(isAdmin ? [
      {id:"inventar", label:"Inventari", icon:"▣"},
      {id:"raporte", label:"Raportet", icon:"◱"},
    ] : []),
    {id:"shitjet", label:"Shitjet", icon:"≡"},
  ];

  return (
    <div style={{display:"flex",minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap');
        @keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
        @keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        input,select{outline:none!important;}
        input:focus,select:focus{border-color:#f0c040!important;}
        button:active{opacity:0.85}
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#0f0f1c} ::-webkit-scrollbar-thumb{background:#2a2a40;border-radius:3px}
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}

      {/* Receipt Modal */}
      {receiptSale && (
        <div style={{position:"fixed",inset:0,background:"#000a",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,width:340,padding:"2rem",animation:"fadeUp 0.3s ease"}}>
            <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
              <div style={{fontSize:"2.5rem",color:C.green}}>✓</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.2rem",fontWeight:800,color:C.accent}}>RetailOS</div>
              <div style={{color:C.muted,fontSize:"0.78rem"}}>{receiptSale.date} • {receiptSale.cashier}</div>
            </div>
            <div style={{borderTop:`1px dashed ${C.dim}`,borderBottom:`1px dashed ${C.dim}`,padding:"1rem 0",marginBottom:"1rem"}}>
              {receiptSale.items.map((i,idx)=>(
                <div key={idx} style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",marginBottom:4}}>
                  <span>{i.name} x{i.qty}</span>
                  <span style={{color:C.accent}}>{(i.price*i.qty).toLocaleString()} L</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:"1rem",marginBottom:4}}>
              <span>TOTAL</span><span style={{color:C.accent}}>{receiptSale.total.toLocaleString()} L</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",color:C.muted,marginBottom:4}}>
              <span>U pagua</span><span>{receiptSale.paid.toLocaleString()} L</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",color:C.green,marginBottom:"1.5rem"}}>
              <span>Kusuri</span><span>{receiptSale.change.toLocaleString()} L</span>
            </div>
            <button onClick={()=>setReceiptSale(null)} style={{width:"100%",background:C.accent,border:"none",borderRadius:8,padding:"0.65rem",color:"#000",fontWeight:700,cursor:"pointer"}}>
              Mbyll Faturën
            </button>
          </div>
        </div>
      )}

      {/* Product Modal (add/edit) */}
      {modal && (modal.type==="add"||modal.type==="edit") && (
        <div style={{position:"fixed",inset:0,background:"#000a",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,width:"90%",maxWidth:540,maxHeight:"90vh",overflowY:"auto",animation:"fadeUp 0.3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1.25rem 1.75rem",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontWeight:700,color:C.text}}>{modal.type==="add"?"Shto Produkt":"Edito Produkt"}</span>
              <button onClick={()=>setModal(null)} style={{background:"transparent",border:"none",color:C.muted,fontSize:"1.1rem",cursor:"pointer"}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",padding:"1.5rem 1.75rem"}}>
              {[
                {label:"Emri *",key:"name",type:"text"},{label:"Barkodi",key:"barcode",type:"text"},
                {label:"Çmimi (L) *",key:"price",type:"number"},{label:"Stoku",key:"stock",type:"number"},
                {label:"Stok minimal",key:"minStock",type:"number"},{label:"Njësia",key:"unit",type:"text"},
              ].map(f=>(
                <div key={f.key}>
                  <label style={{display:"block",color:C.muted,fontSize:"0.73rem",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>{f.label}</label>
                  <input type={f.type} value={form[f.key]||""} onChange={e=>setForm(v=>({...v,[f.key]:e.target.value}))}
                    style={{width:"100%",background:C.bg,border:`1px solid ${C.dim}`,borderRadius:7,padding:"0.6rem 0.75rem",color:C.text,fontSize:"0.88rem",boxSizing:"border-box"}}/>
                </div>
              ))}
              <div>
                <label style={{display:"block",color:C.muted,fontSize:"0.73rem",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>Kategoria</label>
                <select value={form.category||"Ushqim"} onChange={e=>setForm(v=>({...v,category:e.target.value}))}
                  style={{width:"100%",background:C.bg,border:`1px solid ${C.dim}`,borderRadius:7,padding:"0.6rem 0.75rem",color:C.text,fontSize:"0.88rem"}}>
                  {CATEGORIES.filter(c=>c!=="Të gjitha").map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"flex",gap:10,padding:"1.25rem 1.75rem",borderTop:`1px solid ${C.border}`,justifyContent:"flex-end"}}>
              <button onClick={()=>setModal(null)} style={{padding:"0.6rem 1.2rem",background:"transparent",border:`1px solid ${C.dim}`,borderRadius:8,color:C.muted,cursor:"pointer"}}>Anulo</button>
              <button onClick={()=>{
                if(!form.name||!form.price) return showToast("Plotëso emrin dhe çmimin!","error");
                if(modal.type==="add") dispatch({type:"ADD",p:{...form,price:+form.price,stock:+form.stock||0,minStock:+form.minStock||5}});
                else dispatch({type:"UPDATE",id:modal.data.id,data:{...form,price:+form.price,stock:+form.stock,minStock:+form.minStock}});
                setModal(null); showToast(modal.type==="add"?"Produkti u shtua!":"Ndryshimet u ruajtën!");
              }} style={{padding:"0.6rem 1.2rem",background:C.accent,border:"none",borderRadius:8,color:"#000",fontWeight:700,cursor:"pointer"}}>
                ✓ Ruaj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {modal?.type==="restock" && (
        <div style={{position:"fixed",inset:0,background:"#000a",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,width:340,animation:"fadeUp 0.3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1.25rem 1.75rem",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontWeight:700}}>Rimbush Stokun</span>
              <button onClick={()=>setModal(null)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer"}}>✕</button>
            </div>
            <div style={{padding:"1.5rem 1.75rem"}}>
              <p style={{color:C.text,fontWeight:600,marginBottom:4}}>{modal.data.name}</p>
              <p style={{color:C.muted,fontSize:"0.85rem",marginBottom:"1.5rem"}}>Stoku aktual: <span style={{color:stockColor(modal.data),fontWeight:700}}>{modal.data.stock} {modal.data.unit}</span></p>
              <label style={{display:"block",color:C.muted,fontSize:"0.73rem",textTransform:"uppercase",marginBottom:6}}>Sasia për të shtuar</label>
              <input type="number" min="1" value={form.qty||""} onChange={e=>setForm({qty:e.target.value})}
                style={{width:"100%",background:C.bg,border:`1px solid ${C.dim}`,borderRadius:8,padding:"0.75rem",color:C.text,fontSize:"1.2rem",textAlign:"center",boxSizing:"border-box"}}/>
              {form.qty>0 && <p style={{color:C.green,fontSize:"0.82rem",marginTop:8}}>Pas rimbushjes: {+modal.data.stock + +form.qty} {modal.data.unit}</p>}
            </div>
            <div style={{display:"flex",gap:10,padding:"1rem 1.75rem",borderTop:`1px solid ${C.border}`,justifyContent:"flex-end"}}>
              <button onClick={()=>setModal(null)} style={{padding:"0.6rem 1.2rem",background:"transparent",border:`1px solid ${C.dim}`,borderRadius:8,color:C.muted,cursor:"pointer"}}>Anulo</button>
              <button onClick={()=>{
                if(!form.qty||form.qty<=0) return showToast("Sasia duhet të jetë pozitive!","error");
                dispatch({type:"RESTOCK",id:modal.data.id,qty:form.qty});
                setModal(null); showToast(`+${form.qty} njësi shtuar!`);
              }} style={{padding:"0.6rem 1.2rem",background:C.green,border:"none",borderRadius:8,color:"#000",fontWeight:700,cursor:"pointer"}}>
                ↑ Rimbush
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={{width:200,background:C.card,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"1.5rem 0",flexShrink:0}}>
        <div style={{padding:"0 1.25rem 1.5rem",borderBottom:`1px solid ${C.border}`,marginBottom:"1rem"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.3rem",fontWeight:800,color:C.accent}}>◈ RetailOS</div>
          <div style={{color:C.muted,fontSize:"0.72rem",marginTop:2}}>{user.name} • {isAdmin?"Admin":"Kasier"}</div>
        </div>
        <nav style={{display:"flex",flexDirection:"column",gap:3,padding:"0 0.75rem",flex:1}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setView(n.id)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"0.6rem 0.85rem",borderRadius:8,border:"none",
                background:view===n.id?C.accentDim:"transparent",
                color:view===n.id?C.accent:C.muted,fontWeight:view===n.id?700:400,
                fontSize:"0.88rem",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
              <span style={{fontSize:"1rem",width:18,textAlign:"center"}}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{padding:"1rem 1.25rem",borderTop:`1px solid ${C.border}`}}>
          {(lowStock.length>0||outStock.length>0) && (
            <div style={{background:C.redDim,border:`1px solid ${C.red}40`,borderRadius:8,padding:"0.6rem 0.75rem",marginBottom:"0.75rem",fontSize:"0.75rem"}}>
              <span style={{color:C.red,fontWeight:700}}>⚠ {outStock.length} pa stok</span>
              {lowStock.length>0&&<div style={{color:"#f59e0b",marginTop:2}}>⚡ {lowStock.length} stok i ulët</div>}
            </div>
          )}
          <button onClick={()=>setUser(null)} style={{width:"100%",padding:"0.55rem",background:"transparent",border:`1px solid ${C.dim}`,borderRadius:8,color:C.muted,fontSize:"0.8rem",cursor:"pointer"}}>
            ← Dil
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* ── KASA ── */}
        {view==="kasa" && (
          <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
            {/* Products */}
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"1.25rem 1.5rem",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center"}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Kërko produkt ose barko..."
                  style={{flex:1,background:C.bg,border:`1px solid ${C.dim}`,borderRadius:8,padding:"0.55rem 0.85rem",color:C.text,fontSize:"0.88rem"}}/>
              </div>
              <div style={{display:"flex",gap:6,padding:"0.75rem 1.5rem",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap"}}>
                {CATEGORIES.map(c=>(
                  <button key={c} onClick={()=>setCatFilter(c)}
                    style={{padding:"0.3rem 0.75rem",borderRadius:20,border:`1px solid ${catFilter===c?C.accent:C.dim}`,
                      background:catFilter===c?C.accentDim:"transparent",color:catFilter===c?C.accent:C.muted,fontSize:"0.78rem",cursor:"pointer"}}>
                    {c}
                  </button>
                ))}
              </div>
              <div style={{flex:1,overflowY:"auto",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,padding:"1rem 1.5rem",alignContent:"start"}}>
                {filteredProds.map(p=>(
                  <button key={p.id} onClick={()=>addToCart(p)} disabled={p.stock===0}
                    style={{background:C.card,border:`1px solid ${p.stock===0?C.redDim:C.border}`,borderRadius:10,padding:"0.85rem 0.75rem",
                      textAlign:"left",cursor:p.stock===0?"not-allowed":"pointer",opacity:p.stock===0?0.5:1,transition:"border-color 0.15s",
                      display:"flex",flexDirection:"column",gap:4}}>
                    <span style={{fontSize:"0.68rem",color:C.muted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{p.category}</span>
                    <span style={{fontWeight:600,color:C.text,fontSize:"0.88rem",lineHeight:1.3}}>{p.name}</span>
                    <span style={{color:C.accent,fontWeight:700,fontSize:"1rem"}}>{p.price.toLocaleString()} L</span>
                    <span style={{fontSize:"0.72rem",color:stockColor(p)}}>{p.stock===0?"Pa stok":`${p.stock} ${p.unit}`}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart */}
            <div style={{width:300,background:C.card,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}}>
              <div style={{padding:"1.25rem 1.25rem 1rem",borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontWeight:700,fontSize:"1rem",color:C.text}}>🛒 Shporta</div>
                <div style={{color:C.muted,fontSize:"0.78rem"}}>{cart.length} artikuj</div>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"0.75rem"}}>
                {cart.length===0 && <div style={{textAlign:"center",color:C.muted,padding:"2rem",fontSize:"0.85rem"}}>Shporta është bosh.<br/>Kliko produkte për t'i shtuar.</div>}
                {cart.map(i=>(
                  <div key={i.id} style={{background:C.bg,borderRadius:8,padding:"0.65rem 0.75rem",marginBottom:6,display:"flex",flexDirection:"column",gap:4}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <span style={{fontSize:"0.84rem",fontWeight:600,color:C.text,flex:1,lineHeight:1.3}}>{i.name}</span>
                      <button onClick={()=>removeFromCart(i.id)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:"0.9rem",padding:0,marginLeft:8}}>✕</button>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <button onClick={()=>updateQty(i.id,i.qty-1)} style={{background:C.dim,border:"none",borderRadius:4,width:22,height:22,color:C.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                        <span style={{fontSize:"0.85rem",width:20,textAlign:"center"}}>{i.qty}</span>
                        <button onClick={()=>updateQty(i.id,i.qty+1)} style={{background:C.dim,border:"none",borderRadius:4,width:22,height:22,color:C.text,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      </div>
                      <span style={{color:C.accent,fontWeight:700,fontSize:"0.9rem"}}>{(i.price*i.qty).toLocaleString()} L</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{padding:"1rem",borderTop:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.75rem"}}>
                  <span style={{color:C.muted,fontSize:"0.88rem"}}>TOTAL</span>
                  <span style={{color:C.accent,fontWeight:700,fontSize:"1.2rem"}}>{cartTotal.toLocaleString()} L</span>
                </div>
                <input type="number" value={paid} onChange={e=>setPaid(e.target.value)} placeholder="Pagesa e klientit (L)"
                  style={{width:"100%",background:C.bg,border:`1px solid ${C.dim}`,borderRadius:8,padding:"0.6rem 0.75rem",color:C.text,fontSize:"0.9rem",marginBottom:8,boxSizing:"border-box"}}/>
                {paid && +paid>=cartTotal && (
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,padding:"0.5rem 0.75rem",background:C.greenDim,borderRadius:6}}>
                    <span style={{color:C.green,fontSize:"0.82rem"}}>Kusuri</span>
                    <span style={{color:C.green,fontWeight:700}}>{change.toLocaleString()} L</span>
                  </div>
                )}
                <button onClick={completeSale} style={{width:"100%",background:C.accent,border:"none",borderRadius:8,padding:"0.7rem",color:"#000",fontWeight:700,fontSize:"0.95rem",cursor:"pointer"}}>
                  ✓ Përfundo Shitjen
                </button>
                {cart.length>0 && <button onClick={()=>setCart([])} style={{width:"100%",background:"transparent",border:`1px solid ${C.dim}`,borderRadius:8,padding:"0.55rem",color:C.muted,fontSize:"0.8rem",cursor:"pointer",marginTop:6}}>Pastro shportën</button>}
              </div>
            </div>
          </div>
        )}

        {/* ── INVENTARI ── */}
        {view==="inventar" && isAdmin && (
          <div style={{flex:1,overflow:"auto",padding:"1.5rem 2rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.5rem"}}>
              <div>
                <h1 style={{margin:0,fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800}}>Inventari</h1>
                <p style={{margin:"4px 0 0",color:C.muted,fontSize:"0.85rem"}}>{products.length} produkte totale</p>
              </div>
              <button onClick={()=>{setForm({name:"",category:"Ushqim",price:"",stock:"",minStock:"",barcode:"",unit:"copë"});setModal({type:"add"});}}
                style={{padding:"0.6rem 1.2rem",background:C.accent,border:"none",borderRadius:8,color:"#000",fontWeight:700,cursor:"pointer",fontSize:"0.88rem"}}>
                ＋ Shto Produkt
              </button>
            </div>

            {/* Search & Filter */}
            <div style={{display:"flex",gap:10,marginBottom:"1rem",flexWrap:"wrap"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Kërko..."
                style={{background:C.card,border:`1px solid ${C.dim}`,borderRadius:8,padding:"0.55rem 0.85rem",color:C.text,fontSize:"0.88rem",width:220}}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {CATEGORIES.map(c=>(
                  <button key={c} onClick={()=>setCatFilter(c)}
                    style={{padding:"0.3rem 0.7rem",borderRadius:20,border:`1px solid ${catFilter===c?C.accent:C.dim}`,
                      background:catFilter===c?C.accentDim:"transparent",color:catFilter===c?C.accent:C.muted,fontSize:"0.75rem",cursor:"pointer"}}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1.8fr",padding:"0.7rem 1rem",borderBottom:`1px solid ${C.border}`,background:"#0d0d1a"}}>
                {["Emri","Kategoria","Barkodi","Çmimi","Stoku","Min.","Veprime"].map(h=>(
                  <span key={h} style={{fontSize:"0.7rem",color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</span>
                ))}
              </div>
              {filteredProds.map((p,idx)=>(
                <div key={p.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 1.8fr",padding:"0.75rem 1rem",
                  borderBottom:idx<filteredProds.length-1?`1px solid ${C.border}`:"none",alignItems:"center",
                  background:idx%2===0?C.card:"#0d0d1a"}}>
                  <span style={{fontWeight:600,fontSize:"0.88rem"}}>{p.name}</span>
                  <span style={{background:C.dim,borderRadius:4,padding:"0.15rem 0.4rem",fontSize:"0.72rem",color:C.muted,display:"inline-block"}}>{p.category}</span>
                  <span style={{color:C.muted,fontFamily:"monospace",fontSize:"0.82rem"}}>{p.barcode}</span>
                  <span style={{color:C.accent,fontWeight:600}}>{p.price.toLocaleString()} L</span>
                  <span style={{color:stockColor(p),fontWeight:700}}>{p.stock} <span style={{color:C.muted,fontWeight:400,fontSize:"0.75rem"}}>{p.unit}</span></span>
                  <span style={{color:C.muted,fontSize:"0.85rem"}}>{p.minStock}</span>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>{setForm({qty:""});setModal({type:"restock",data:p});}}
                      style={{padding:"0.3rem 0.6rem",background:C.greenDim,border:`1px solid ${C.green}40`,borderRadius:6,color:C.green,fontSize:"0.75rem",cursor:"pointer",fontWeight:600}}>↑ Rimbush</button>
                    <button onClick={()=>{setForm({...p});setModal({type:"edit",data:p});}}
                      style={{padding:"0.3rem 0.55rem",background:C.blueDim,border:`1px solid ${C.blue}40`,borderRadius:6,color:C.blue,cursor:"pointer",fontSize:"0.82rem"}}>✎</button>
                    <button onClick={()=>{dispatch({type:"DELETE",id:p.id});showToast(`"${p.name}" u fshi.`,"warn");}}
                      style={{padding:"0.3rem 0.55rem",background:C.redDim,border:`1px solid ${C.red}40`,borderRadius:6,color:C.red,cursor:"pointer",fontSize:"0.82rem"}}>✕</button>
                  </div>
                </div>
              ))}
              {filteredProds.length===0 && <div style={{textAlign:"center",color:C.muted,padding:"3rem"}}>Asnjë produkt nuk u gjet.</div>}
            </div>
          </div>
        )}

        {/* ── RAPORTE ── */}
        {view==="raporte" && isAdmin && (
          <div style={{flex:1,overflow:"auto",padding:"1.5rem 2rem"}}>
            <h1 style={{margin:"0 0 1.5rem",fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800}}>Raportet</h1>

            {/* KPIs */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:"1.5rem"}}>
              {[
                {label:"Shitjet Sot",val:`${todayRevenue.toLocaleString()} L`,sub:`${todaySales.length} transaksione`,color:C.accent},
                {label:"Total të Gjitha",val:`${totalRevenue.toLocaleString()} L`,sub:`${sales.length} transaksione`,color:C.green},
                {label:"Produkte",val:products.length,sub:`${outStock.length} pa stok`,color:C.blue},
                {label:"Vlera Stokut",val:`${products.reduce((s,p)=>s+p.price*p.stock,0).toLocaleString()} L`,sub:"totale",color:"#c084fc"},
              ].map((k,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.1rem 1.25rem"}}>
                  <div style={{color:C.muted,fontSize:"0.72rem",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>{k.label}</div>
                  <div style={{fontSize:"1.4rem",fontWeight:700,color:k.color}}>{k.val}</div>
                  <div style={{color:C.muted,fontSize:"0.75rem",marginTop:3}}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:"1.5rem"}}>
              {/* Line chart */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.25rem"}}>
                <div style={{fontWeight:700,marginBottom:"1rem",fontSize:"0.9rem"}}>Shitjet 7 Ditët e Fundit</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.dim}/>
                    <XAxis dataKey="day" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text}} formatter={v=>`${v.toLocaleString()} L`}/>
                    <Line type="monotone" dataKey="total" stroke={C.accent} strokeWidth={2.5} dot={{fill:C.accent,r:4}} activeDot={{r:6}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bar chart */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.25rem"}}>
                <div style={{fontWeight:700,marginBottom:"1rem",fontSize:"0.9rem"}}>Top 5 Produktet</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={C.dim} horizontal={false}/>
                    <XAxis type="number" tick={{fill:C.muted,fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis dataKey="name" type="category" tick={{fill:C.muted,fontSize:10}} width={80} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text}} formatter={v=>`${v.toLocaleString()} L`}/>
                    <Bar dataKey="val" fill={C.green} radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent sales table */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"1rem 1.25rem",borderBottom:`1px solid ${C.border}`,fontWeight:700,fontSize:"0.9rem"}}>Shitjet e Fundit</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",padding:"0.6rem 1.25rem",background:"#0d0d1a",borderBottom:`1px solid ${C.border}`}}>
                {["Data","Artikujt","Total","Kasier"].map(h=><span key={h} style={{fontSize:"0.7rem",color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</span>)}
              </div>
              {[...sales].reverse().slice(0,8).map((s,i)=>(
                <div key={s.id} style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",padding:"0.75rem 1.25rem",
                  borderBottom:`1px solid ${C.border}`,background:i%2===0?C.card:"#0d0d1a",alignItems:"center"}}>
                  <span style={{color:C.muted,fontSize:"0.82rem"}}>{s.date}</span>
                  <span style={{color:C.text,fontSize:"0.82rem"}}>{s.items.map(i=>`${i.name}×${i.qty}`).join(", ")}</span>
                  <span style={{color:C.accent,fontWeight:700}}>{s.total.toLocaleString()} L</span>
                  <span style={{color:C.muted,fontSize:"0.82rem"}}>{s.cashier}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SHITJET ── */}
        {view==="shitjet" && (
          <div style={{flex:1,overflow:"auto",padding:"1.5rem 2rem"}}>
            <h1 style={{margin:"0 0 1.5rem",fontFamily:"'Syne',sans-serif",fontSize:"1.5rem",fontWeight:800}}>Historiku i Shitjeve</h1>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",padding:"0.65rem 1.25rem",background:"#0d0d1a",borderBottom:`1px solid ${C.border}`}}>
                {["Data","Artikujt","Total","Kasier"].map(h=><span key={h} style={{fontSize:"0.7rem",color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</span>)}
              </div>
              {[...sales].reverse().map((s,i)=>(
                <div key={s.id} style={{display:"grid",gridTemplateColumns:"1fr 2fr 1fr 1fr",padding:"0.8rem 1.25rem",
                  borderBottom:i<sales.length-1?`1px solid ${C.border}`:"none",
                  background:i%2===0?C.card:"#0d0d1a",alignItems:"center"}}>
                  <span style={{color:C.muted,fontSize:"0.82rem"}}>{s.date}</span>
                  <span style={{color:C.text,fontSize:"0.82rem",lineHeight:1.4}}>{s.items.map(i=>`${i.name}×${i.qty}`).join(", ")}</span>
                  <span style={{color:C.accent,fontWeight:700,fontSize:"0.95rem"}}>{s.total.toLocaleString()} L</span>
                  <span style={{color:C.muted,fontSize:"0.82rem"}}>{s.cashier}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
