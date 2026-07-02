'use client';

interface OrderSuccessScreenProps {
  orderNumber: string;
  orderId: string;
  slug: string;
}

export default function OrderSuccessScreen({ orderNumber, orderId, slug }: OrderSuccessScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto">
          <span className="text-4xl">📦</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">تم استلام طلبك!</h1>
          <p className="text-muted-foreground">رقم الطلب</p>
          <p className="text-3xl font-black text-primary mt-1">{orderNumber}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">
            سنقوم بإشعارك عندما يكون طلبك جاهزاً
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            يمكنك متابعة حالة طلبك باستخدام رقم الطلب
          </p>
        </div>
        <a href={`/${slug}`} className="btn-secondary w-full inline-block text-center">
          العودة للقائمة
        </a>
      </div>
    </div>
  );
}
