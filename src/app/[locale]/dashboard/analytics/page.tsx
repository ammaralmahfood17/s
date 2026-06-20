'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, Clock, Download, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatBHD } from '@/lib/utils';
import { exportOrdersCSV, exportItemsReportCSV } from '@/lib/export';
import { ReviewsDashboard } from '@/components/shared/Reviews';
import toast from 'react-hot-toast';

function MiniBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-[#57534e] w-16 text-right flex-shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-[#1a1916] rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-[#a8a29e] w-16 flex-shrink-0 text-right">{value.toFixed(3)}</div>
    </div>
  );
}

const DAYS_S = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_A = ['أح','إث','ثل','أر','خم','جم','سب'];

export default function AnalyticsPage({ params: { locale } }: { params: { locale: string } }) {
  const isAr = locale === 'ar';
  const supabase = createClient();
  const [restaurantId, setRestaurantId] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview'|'reviews'>('overview');
  const [dateFrom, setDateFrom] = useState(() => { const d=new Date();d.setDate(d.getDate()-6);return d.toISOString().split('T')[0]; });
  const [dateTo]   = useState(() => new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({ revenueToday:0, ordersToday:0, revenueWeek:0, avgOrder:0, ordersPending:0 });
  const [revenueByDay, setRevenueByDay] = useState<{date:string;total:number;count:number}[]>([]);
  const [topItems, setTopItems] = useState<{name_en:string;name_ar:string;qty:number;revenue:number}[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) return;
      const { data:r } = await supabase.from('restaurants').select('id').eq('owner_id',user.id).single();
      if (!r) return;
      setRestaurantId(r.id);

      const today = new Date().toISOString().split('T')[0];
      const days = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().split('T')[0];});
      const weekStart = days[0];

      const [ot,pend,wk,comp] = await Promise.all([
        supabase.from('orders').select('id',{count:'exact'}).eq('restaurant_id',r.id).gte('created_at',`${today}T00:00:00`).neq('status','cancelled'),
        supabase.from('orders').select('id',{count:'exact'}).eq('restaurant_id',r.id).in('status',['pending','confirmed','preparing']),
        supabase.from('orders').select('total,created_at').eq('restaurant_id',r.id).gte('created_at',`${weekStart}T00:00:00`).neq('status','cancelled'),
        supabase.from('orders').select('total').eq('restaurant_id',r.id).gte('created_at',`${today}T00:00:00`).eq('status','completed'),
      ]);

      const todayRev=(comp.data??[]).reduce((s:number,o:{total:number})=>s+Number(o.total),0);
      const weekRev=(wk.data??[]).reduce((s:number,o:{total:number})=>s+Number(o.total),0);
      const byDay=days.map(day=>{
        const dos=(wk.data??[]).filter((o:{created_at:string})=>o.created_at.startsWith(day));
        return {date:day,total:dos.reduce((s:number,o:{total:number})=>s+Number(o.total),0),count:dos.length};
      });
      setRevenueByDay(byDay);
      setStats({revenueToday:todayRev,ordersToday:ot.count??0,revenueWeek:weekRev,avgOrder:(ot.count??0)>0?todayRev/(ot.count??1):0,ordersPending:pend.count??0});

      const allIds=(await supabase.from('orders').select('id').eq('restaurant_id',r.id).gte('created_at',`${weekStart}T00:00:00`).neq('status','cancelled')).data??[];
      if(allIds.length>0){
        const {data:ois}=await supabase.from('order_items').select('item_name_en,item_name_ar,quantity,line_total').in('order_id',allIds.map((o:{id:string})=>o.id));
        const map:Record<string,{name_en:string;name_ar:string;qty:number;revenue:number}>={};
        for(const oi of (ois??[]) as {item_name_en:string;item_name_ar:string;quantity:number;line_total:number}[]){
          const k=oi.item_name_en;
          if(!map[k])map[k]={name_en:k,name_ar:oi.item_name_ar,qty:0,revenue:0};
          map[k].qty+=oi.quantity;map[k].revenue+=Number(oi.line_total);
        }
        setTopItems(Object.values(map).sort((a,b)=>b.qty-a.qty).slice(0,8));
      }
      setLoading(false);
    };
    load();
  },[supabase]);

  const handleExport=async(type:'orders'|'items')=>{
    if(!restaurantId)return;
    setExporting(true);
    try{
      if(type==='orders')await exportOrdersCSV(restaurantId,dateFrom,dateTo,isAr?'ar':'en');
      else await exportItemsReportCSV(restaurantId,dateFrom,dateTo);
      toast.success(isAr?'تم التصدير':'Exported');
    }catch{toast.error(isAr?'حدث خطأ':'Export failed');}
    setExporting(false);
  };

  const maxRevDay=Math.max(...revenueByDay.map(d=>d.total),0.001);
  const statCards=[
    {icon:TrendingUp,label:isAr?'إيرادات اليوم':'Revenue Today',value:formatBHD(stats.revenueToday,locale as 'en'|'ar'),color:'text-brand-400'},
    {icon:ShoppingBag,label:isAr?'طلبات اليوم':'Orders Today',value:String(stats.ordersToday),color:'text-blue-400'},
    {icon:BarChart3,label:isAr?'إيرادات الأسبوع':'Week Revenue',value:formatBHD(stats.revenueWeek,locale as 'en'|'ar'),color:'text-purple-400'},
    {icon:Clock,label:isAr?'متوسط الطلب':'Avg. Order',value:formatBHD(stats.avgOrder,locale as 'en'|'ar'),color:'text-teal-400'},
  ];

  if(loading) return <div className="p-6 text-[#57534e]">{isAr?'جار التحميل...':'Loading...'}</div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-[#fafaf9]">{isAr?'التحليلات':'Analytics'}</h1>
        <p className="text-sm text-[#57534e]">{isAr?'نظرة على الأداء':'Performance overview'}</p>
      </div>

      {/* Export row — own line on mobile so it never gets squeezed */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <input type="date" className="input text-sm py-2 px-3 w-32 sm:w-36 flex-shrink-0" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
        <span className="text-[#57534e] flex-shrink-0">—</span>
        <input type="date" className="input text-sm py-2 px-3 w-32 sm:w-36 flex-shrink-0" value={dateTo} readOnly />
        <button onClick={()=>handleExport('orders')} disabled={exporting} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5 flex-shrink-0">
          <Download size={14}/>{isAr?'الطلبات':'Orders CSV'}
        </button>
        <button onClick={()=>handleExport('items')} disabled={exporting} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5 flex-shrink-0">
          <Download size={14}/>{isAr?'العناصر':'Items CSV'}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {[{key:'overview',ar:'نظرة عامة',en:'Overview'},{key:'reviews',ar:'التقييمات',en:'Reviews',icon:Star}].map(tab=>(
          <button key={tab.key} onClick={()=>setActiveTab(tab.key as 'overview'|'reviews')}
            className={`flex items-center gap-1.5 px-4 min-h-[40px] rounded-xl text-sm font-medium transition-all flex-shrink-0 touch-manipulation ${activeTab===tab.key?'bg-brand-500 text-[#0f0e0c]':'text-[#a8a29e] active:bg-[#1a1916]'}`}>
            {tab.icon && <tab.icon size={14}/>}{isAr?tab.ar:tab.en}
          </button>
        ))}
      </div>

      {activeTab==='overview'?(
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map(s=>(
              <div key={s.label} className="stat-card">
                <div className="flex items-center gap-1.5 mb-1"><s.icon size={14} className={s.color}/><span className="stat-label text-xs">{s.label}</span></div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
          {stats.ordersPending>0&&(
            <div className="card border-yellow-800/50 bg-yellow-950/20 flex items-center gap-3 py-3">
              <Clock size={16} className="text-yellow-400"/>
              <span className="text-sm text-yellow-400">{stats.ordersPending} {isAr?'طلب نشط':'active orders needing attention'}</span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="section-title">{isAr?'الإيرادات اليومية (7 أيام)':'Daily Revenue (7 Days)'}</h2>
              {revenueByDay.every(d=>d.total===0)?(
                <div className="text-center py-8 text-[#57534e] text-sm">{isAr?'لا توجد بيانات':'No data yet'}</div>
              ):(
                <div className="space-y-2 mt-2">
                  {revenueByDay.map(day=>(
                    <MiniBar key={day.date} value={day.total} max={maxRevDay} label={isAr?DAYS_A[new Date(day.date).getDay()]:DAYS_S[new Date(day.date).getDay()]} />
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <h2 className="section-title">{isAr?'الأكثر طلباً':'Top Items This Week'}</h2>
              {topItems.length===0?(
                <div className="text-center py-8 text-[#57534e] text-sm">{isAr?'لا توجد بيانات':'No data yet'}</div>
              ):(
                <div className="space-y-3 mt-2">
                  {topItems.map((item,i)=>(
                    <div key={item.name_en} className="flex items-center gap-3">
                      <span className="text-sm w-5 flex-shrink-0">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#fafaf9] truncate">{isAr?item.name_ar:item.name_en}</div>
                        <div className="text-xs text-[#57534e]">{item.qty} {isAr?'وحدة':'sold'}</div>
                      </div>
                      <div className="text-sm text-brand-400 font-semibold">{formatBHD(item.revenue,locale as 'en'|'ar')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ):(
        restaurantId&&<ReviewsDashboard restaurantId={restaurantId} locale={locale}/>
      )}
    </div>
  );
}
