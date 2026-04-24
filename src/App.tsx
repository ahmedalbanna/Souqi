import { useState, useEffect, createContext, useContext } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation 
} from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User,
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { processYemeniVoiceToPrice, getAgriculturalTip, type ProcessedPriceReport } from './lib/gemini';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Mic, 
  ShoppingBag, 
  CloudRain, 
  User as UserIcon,
  Search,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Context ---
interface AppContextType {
  user: User | null;
  loading: boolean;
  priceReports: any[];
  crops: any[];
  markets: any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

// --- Components ---

function Header() {
  const { user } = useApp();

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-white px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">س</div>
          <h1 className="text-xl font-black text-primary tracking-tight hidden sm:block">سوقي <span className="text-xs font-normal text-secondary mr-1 opacity-70">| منصة المزارع اليمني</span></h1>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end border-r border-border pr-4 mr-4">
          <span className="text-[10px] uppercase tracking-widest text-muted">حالة الشبكة</span>
          <span className="text-xs font-bold text-secondary flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            USSD متصل (#123#)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 group">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-text">{user.displayName}</p>
                <button 
                  onClick={() => signOut(auth)}
                  className="text-[10px] text-muted hover:text-alert uppercase tracking-widest transition-colors"
                >
                  تسجيل الخروج
                </button>
              </div>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="h-9 w-9 rounded-full border border-border shadow-sm group-hover:border-secondary transition-colors"
              />
            </div>
          ) : (
            <button 
              onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
              className="rounded-lg bg-primary px-5 py-1.5 text-xs font-bold text-white transition-all shadow-sm hover:opacity-90 active:scale-95"
            >
              دخول
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'السوق', icon: LayoutDashboard },
    { path: '/report', label: 'إبلاغ', icon: Mic },
    { path: '/crops', label: 'المحاصيل', icon: ShoppingBag },
    { path: '/advice', label: 'إرشاد', icon: CloudRain },
  ];

  return (
    <>
      <nav className="fixed bottom-12 left-0 right-0 z-40 border-t border-border bg-white px-2 py-1 sm:hidden shadow-lg">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-2 transition-all active:scale-95",
                  isActive ? "text-primary scale-110" : "text-muted"
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 3 : 2} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sticky Bottom Alert Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-text text-white flex items-center px-4 gap-4 overflow-hidden z-50 border-t border-white/10 shadow-2xl">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-[10px] font-black tracking-widest uppercase text-white/90">عاجل:</span>
        </div>
        <div className="flex-1 text-xs overflow-hidden h-full flex items-center relative">
          <motion.div 
            animate={{ x: [-200, 1000] }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            className="absolute whitespace-nowrap opacity-80 font-medium"
          >
             سوق صبر (لحج): وفرة كبيرة في محصول الحبحب وانخفاض السعر بنسبة 20%... تنبيه لقطاع النقل: طريق هيجة العبد مفتوح ببطء نتيجة الضباب... منظمة الفاو تطلق حملة مكافحة الجراد في تهامة... 
          </motion.div>
        </div>
        <div className="hidden md:flex items-center gap-4 shrink-0 text-[10px] text-white/40 font-mono">
          <span>المستخدمين: 14,802</span>
        </div>
      </footer>
    </>
  );
}

// --- Pages ---

function Dashboard() {
  const { priceReports } = useApp();

  return (
    <div className="space-y-6">
      {/* Analytics/Insight Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-primary p-4 rounded-xl text-white flex flex-col justify-between shadow-sm">
          <span className="text-[10px] uppercase tracking-widest opacity-70">إجمالي البلاغات اليوم</span>
          <div className="text-2xl font-bold mt-1">1,248</div>
          <div className="text-[10px] mt-2 bg-white/10 p-1 rounded inline-block text-center">+240 بلاغ جديد</div>
        </div>
        <div className="bg-white border border-border p-4 rounded-xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-muted uppercase tracking-widest">أعلى زيادة سعرية</span>
          <div className="text-lg font-bold text-alert mt-1">الرمان (صعدة)</div>
          <div className="text-xs font-mono text-muted">+15% في سوق عدن</div>
        </div>
        <div className="bg-white border border-border p-4 rounded-xl flex flex-col justify-between shadow-sm">
          <span className="text-[10px] text-muted uppercase tracking-widest">الموثوقية الإجمالية</span>
          <div className="text-xl font-bold text-secondary mt-1 tracking-tighter">94.2%</div>
          <div className="w-full bg-border-light h-1 rounded-full overflow-hidden mt-2">
            <div className="bg-secondary h-full w-[94.2%] transition-all duration-1000"></div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-md font-bold flex items-center gap-2">
            <svg className="w-4 h-4 text-alert" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path></svg>
            نبض سوق الجملة اللحظي
          </h2>
          <div className="flex gap-2 text-[10px]">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold">خضروات</span>
            <span className="px-2 py-0.5 bg-accent-dark/50 text-text rounded-full font-bold">فواكه</span>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right market-table">
              <thead>
                <tr className="bg-[#F8F7F2] text-muted border-b border-border">
                  <th className="p-3 font-bold text-[10px]">السلعة / الوحدة</th>
                  <th className="p-3 font-bold text-[10px]">السعر</th>
                  <th className="p-3 font-bold text-[10px] text-left">التغيير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                <AnimatePresence mode="popLayout" initial={false}>
                  {priceReports.map((report) => (
                    <motion.tr
                      key={report.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-base transition-colors group cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="font-bold text-sm text-text flex items-center gap-2">
                          {report.cropIcon || '📦'} {report.cropNameAr}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">سوق {report.marketNameAr} • {report.unit}</div>
                      </td>
                      <td className="p-4 font-mono font-bold text-primary group-hover:scale-105 transition-transform origin-right">
                        {report.price.toLocaleString()} ر.ي
                      </td>
                      <td className="p-4 text-left">
                         <span className={cn(
                           "text-[10px] font-black px-2 py-0.5 rounded-full",
                           report.price > 10000 ? "bg-red-50 text-alert" : "bg-green-50 text-secondary"
                         )}>
                           {report.price > 10000 ? "+4% ↑" : "-2% ↓"}
                         </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function Report() {
  const { user } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'done' | 'error'>('idle');
  const [processedData, setProcessedData] = useState<ProcessedPriceReport | null>(null);

  const startReporting = () => {
    if (!user) {
      alert("الرجاء تسجيل الدخول أولاً للمشاركة بالأسعار.");
      return;
    }
    setIsRecording(true);
    setStatus('recording');
    
    setTimeout(async () => {
      setIsRecording(false);
      setStatus('processing');
      
      const transcript = "في سوق صنعاء الجملة، سلة الطماط بـ 4000 ريال";
      const result = await processYemeniVoiceToPrice(transcript);
      
      if (result) {
        setProcessedData(result);
        setStatus('done');
      } else {
        setStatus('error');
      }
    }, 3000);
  };

  const confirmSubmit = async () => {
    if (!processedData || !user) return;
    
    try {
      await addDoc(collection(db, 'priceReports'), {
        ...processedData,
        reportedBy: user.uid,
        reporterName: user.displayName,
        timestamp: serverTimestamp(),
        isVerified: false,
        cropNameAr: processedData.cropId,
        marketNameAr: processedData.marketId,
        cropIcon: '📦'
      });
      setStatus('idle');
      alert("تم إرسال السعر بنجاح، شكراً لمساهمتك!");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'priceReports');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 px-4">
      <div className="text-center space-y-3 max-w-xs">
        <h1 className="text-2xl font-black text-primary tracking-tight">سجل سعراً جديداً</h1>
        <p className="text-xs text-muted font-medium leading-relaxed">تحدث بلهجتك الطبيعية، وسيقوم نظام "سوقي" بتحويل صوتك إلى بيانات سعرية دقيقة.</p>
      </div>

      <div className="relative">
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.2 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-full bg-primary"
            />
          )}
        </AnimatePresence>
        
        <button 
          onClick={startReporting}
          disabled={status === 'processing'}
          className={cn(
            "relative z-10 flex h-32 w-32 items-center justify-center rounded-full shadow-2xl transition-all active:scale-95",
            status === 'recording' ? "bg-alert text-white" : "bg-primary text-white",
            status === 'processing' && "bg-border-light text-muted animate-pulse"
          )}
        >
          {status === 'processing' ? <Clock size={44} /> : <Mic size={44} strokeWidth={2.5} />}
        </button>

        {status === 'recording' && (
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1">
             {[1,2,3,4].map(i => (
               <motion.div 
                 key={i}
                 animate={{ height: [8, 20, 8] }}
                 transition={{ repeat: Infinity, duration: 0.5, delay: i*0.1 }}
                 className="w-1 bg-alert rounded-full"
               />
             ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-sm">
        {status === 'processing' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center italic text-primary font-black text-sm tracking-tighter"
          >
            جاري معالجة الصوت وتحليل اللهجة اليمنية...
          </motion.div>
        )}
        
        {status === 'done' && processedData && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border border-border bg-white p-6 shadow-soft space-y-6"
          >
            <div className="flex items-center justify-between border-b border-border-light pb-4">
              <span className="text-[10px] uppercase tracking-widest text-muted font-bold">المعلومات المستخرجة تلقائياً</span>
              <span className="flex items-center gap-1 text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-md font-black">
                موثوقية {Math.round(processedData.confidence * 100)}%
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">المحصول</p>
                <p className="font-black text-text">{processedData.cropId}</p>
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">السوق المركزي</p>
                <p className="font-black text-text">{processedData.marketId}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">السعر التقديري</p>
                <p className="font-mono font-black text-primary text-xl">{processedData.price.toLocaleString()} <span className="text-[10px] font-normal">ر.ي</span></p>
              </div>
              <div className="space-y-0.5 text-left">
                <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">وحدة القياس</p>
                <p className="font-bold text-text">{processedData.unit}</p>
              </div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={confirmSubmit}
                className="w-full rounded-xl bg-primary py-4 text-white font-black text-sm shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98]"
              >
                تحديث أسعار السوق الآن
              </button>
              <button 
                onClick={() => setStatus('idle')}
                className="w-full py-2 text-[10px] text-muted hover:text-alert font-bold uppercase tracking-widest transition-colors"
              >
                إلغاء وإعادة التسجيل
              </button>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="text-center p-4 rounded-xl border border-red-100 bg-red-50 text-alert text-[10px] font-bold uppercase tracking-wider">
            عذراً، لم نتمكن من تحليل الصوت. يرجى المحاولة مرة أخرى بوضوح.
          </div>
        )}
      </div>
    </div>
  );
}

function Advice() {
  const [tip, setTip] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);

  const fetchTip = async () => {
    setLoadingTip(true);
    const result = await getAgriculturalTip("أمطار غزيرة متوقعة في صنعاء وذمار غداً");
    setTip(result);
    setLoadingTip(false);
  };

  useEffect(() => {
    fetchTip();
  }, []);

  return (
    <div className="space-y-6">
      {/* Weather & Agricultural Advice */}
      <div className="bg-accent border border-accent-dark p-6 rounded-2xl shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
            إرشاد الطقس المحلي
          </h3>
          <span className="text-[10px] font-bold text-alert px-3 py-1 bg-red-100 rounded-full animate-pulse border border-red-200 uppercase tracking-tighter">تنبيه هطول</span>
        </div>
        <div className="flex gap-6 items-center mb-6">
          <div className="text-5xl font-light text-primary">28°</div>
          <div className="text-sm">
            <div className="font-bold text-text">ذمار - جهران</div>
            <div className="text-secondary font-medium">أمطار غزيرة متوقعة خلال 48 ساعة</div>
          </div>
        </div>
        
        <div className="relative overflow-hidden rounded-xl border border-accent-dark bg-white/60 p-5 shadow-inner">
          {loadingTip ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-accent-dark rounded w-full"></div>
              <div className="h-4 bg-accent-dark rounded w-3/4"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-md leading-relaxed text-text font-medium italic">
                "{tip || "يُنصح بتأخير رش المبيدات الحشرية لمحاصيل الحبوب لتجنب غسلها بالأمطار القادمة."}"
              </p>
              <div className="flex justify-end gap-3">
                <button className="flex items-center gap-2 text-[10px] font-black text-white bg-primary px-4 py-2 rounded-lg shadow-sm hover:opacity-90 transition-opacity">
                  <Mic size={14} /> استمع للنصيحة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-primary p-5 rounded-2xl text-white text-center shadow-lg shadow-primary/10">
        <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2">كود الخدمة السريع (بدون إنترنت)</div>
        <div className="text-3xl font-mono font-bold tracking-widest">#123*1*22#</div>
        <div className="text-[10px] mt-2 opacity-80">للتحقق من سعر الطماطم عبر أي هاتف نوكيا عادي</div>
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceReports, setPriceReports] = useState<any[]>([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    const mockReports = [
      { id: '1', cropNameAr: 'طماط', marketNameAr: 'صنعاء - الجملة', price: 3500, unit: 'سلة 5كجم', cropIcon: '🍅' },
      { id: '2', cropNameAr: 'عسل سدر', marketNameAr: 'سيئون - المركزي', price: 25000, unit: 'لتر', cropIcon: '🍯' },
      { id: '3', cropNameAr: 'بُن خولاني', marketNameAr: 'حجة', price: 15000, unit: 'كجم', cropIcon: '☕' },
      { id: '4', cropNameAr: 'بطاط', marketNameAr: 'ذمار', price: 2800, unit: 'كيس زراعي', cropIcon: '🥔' },
    ];
    setPriceReports(mockReports);

    const q = query(collection(db, 'priceReports'), orderBy('timestamp', 'desc'), limit(20));
    const unsubData = onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (reports.length > 0) setPriceReports(reports);
    }, (error) => console.warn("Firestore listener restricted", error));

    return () => { unsubAuth(); unsubData(); };
  }, []);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-primary font-black animate-pulse">سوقي... جاري الاتصال بالشبكة</div>;

  return (
    <AppContext.Provider value={{ user, loading, priceReports, crops: [], markets: [] }}>
      <Router>
        <div className="min-h-screen bg-base text-text font-sans pb-32 sm:pb-24 overflow-x-hidden" dir="rtl">
          <Header />
          <main className="mx-auto max-w-lg px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/report" element={<Report />} />
              <Route path="/crops" element={<div className="p-12 text-center text-muted italic font-medium bg-white border border-border border-dashed rounded-3xl">قريباً: قائمة المحاصيل الكاملة والبحث المتقدم</div>} />
              <Route path="/advice" element={<Advice />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </Router>
    </AppContext.Provider>
  );
}
