'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Crown, Shield, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { RestaurantStaff } from '@/types';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  owner:   { icon: Crown,  colorEn: 'Owner',   colorAr: 'مالك',   color: 'text-yellow-400' },
  manager: { icon: Shield, colorEn: 'Manager', colorAr: 'مدير',   color: 'text-blue-400' },
  staff:   { icon: User,   colorEn: 'Staff',   colorAr: 'موظف',   color: 'text-[#a8a29e]' },
};

export default function TeamPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isAr = locale === 'ar';
  const supabase = createClient();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [staff, setStaff] = useState<(RestaurantStaff & { email?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'staff'>('staff');
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: r } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    if (!r) return;
    setRestaurantId(r.id);

    const { data: members } = await supabase
      .from('restaurant_staff')
      .select('*')
      .eq('restaurant_id', r.id)
      .order('created_at');

    setStaff((members as RestaurantStaff[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!restaurantId || !inviteEmail) return;
    setInviting(true);

    // In production: send email invite via Supabase Edge Function or resend.
    // For now: look up user by email and add directly.
    const { data: existingUser } = await supabase
      .from('restaurant_staff')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('invited_email', inviteEmail)
      .single();

    if (existingUser) {
      toast.error(isAr ? 'تمت الدعوة بالفعل' : 'Already invited');
      setInviting(false);
      return;
    }

    const { error } = await supabase.from('restaurant_staff').insert({
      restaurant_id: restaurantId,
      user_id: currentUserId, // placeholder — in production: resolve by email
      invited_email: inviteEmail,
      role: inviteRole,
    });

    if (!error) {
      toast.success(isAr ? `تمت دعوة ${inviteEmail}` : `Invited ${inviteEmail}`);
      setInviteEmail('');
      setShowInvite(false);
      load();
    } else {
      toast.error(isAr ? 'حدث خطأ' : 'Something went wrong');
    }
    setInviting(false);
  };

  const removeMember = async (memberId: string) => {
    if (!confirm(isAr ? 'إزالة العضو من الفريق؟' : 'Remove member from team?')) return;
    await supabase.from('restaurant_staff').delete().eq('id', memberId);
    toast.success(isAr ? 'تمت الإزالة' : 'Removed');
    load();
  };

  const updateRole = async (memberId: string, role: 'manager' | 'staff') => {
    await supabase.from('restaurant_staff').update({ role }).eq('id', memberId);
    toast.success(isAr ? 'تم تحديث الدور' : 'Role updated');
    load();
  };

  if (loading) {
    return <div className="p-6 text-[#57534e]">{isAr ? 'جار التحميل...' : 'Loading...'}</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#fafaf9]">
            {isAr ? 'الفريق' : 'Team'}
          </h1>
          <p className="text-sm text-[#57534e]">
            {isAr ? 'إدارة أعضاء الفريق وأدوارهم' : 'Manage team members and roles'}
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="btn-primary text-sm"
        >
          <Plus size={16} />
          {isAr ? 'دعوة عضو' : 'Invite Member'}
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="card space-y-3 animate-slide-up border-brand-500/30">
          <h3 className="font-semibold text-[#fafaf9] text-sm">
            {isAr ? 'دعوة عضو جديد' : 'Invite New Member'}
          </h3>
          <div>
            <label className="label">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
            <input
              type="email"
              className="input"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder={isAr ? 'example@gmail.com' : 'example@gmail.com'}
            />
          </div>
          <div>
            <label className="label">{isAr ? 'الدور' : 'Role'}</label>
            <div className="flex gap-2">
              {(['manager', 'staff'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setInviteRole(role)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                    inviteRole === role
                      ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                      : 'border-[#2a2825] text-[#57534e] hover:border-[#3a3835]'
                  }`}
                >
                  {role === 'manager'
                    ? (isAr ? '🛡 مدير' : '🛡 Manager')
                    : (isAr ? '👤 موظف' : '👤 Staff')
                  }
                </button>
              ))}
            </div>
            <p className="text-xs text-[#57534e] mt-1.5">
              {inviteRole === 'manager'
                ? (isAr ? 'يمكنه إدارة القائمة والطلبات والفريق' : 'Can manage menu, orders, and team')
                : (isAr ? 'يمكنه رؤية وتحديث الطلبات فقط' : 'Can view and update orders only')
              }
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowInvite(false); setInviteEmail(''); }}
              className="btn-secondary flex-1 text-sm"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail}
              className="btn-primary flex-1 text-sm"
            >
              {inviting ? '...' : (isAr ? 'إرسال الدعوة' : 'Send Invite')}
            </button>
          </div>
        </div>
      )}

      {/* Team members */}
      {staff.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={48} className="text-[#3a3835] mx-auto mb-3" />
          <p className="text-[#a8a29e] font-medium">
            {isAr ? 'لا يوجد أعضاء في الفريق بعد' : 'No team members yet'}
          </p>
          <p className="text-sm text-[#57534e] mt-1">
            {isAr
              ? 'ادعُ المديرين والموظفين للمساعدة في إدارة مطعمك'
              : 'Invite managers and staff to help run your restaurant'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map((member) => {
            const roleConf = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.staff;
            const RoleIcon = roleConf.icon;
            const isCurrentUser = member.user_id === currentUserId;
            const isOwner = member.role === 'owner';

            return (
              <div key={member.id} className="card flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#2a2825] flex items-center
                                justify-center flex-shrink-0 font-bold text-[#a8a29e]">
                  {(member.invited_email ?? 'U')[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#fafaf9] font-medium truncate">
                      {member.invited_email ?? (isAr ? 'مستخدم' : 'User')}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">
                        {isAr ? 'أنت' : 'You'}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 text-xs mt-0.5 ${roleConf.color}`}>
                    <RoleIcon size={11} />
                    {isAr ? roleConf.colorAr : roleConf.colorEn}
                  </div>
                </div>

                {/* Role dropdown + remove */}
                {!isOwner && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={member.role}
                      onChange={e => updateRole(member.id, e.target.value as 'manager' | 'staff')}
                      className="text-xs bg-[#0f0e0c] border border-[#2a2825] rounded-lg px-2 min-h-[36px]
                                 text-[#a8a29e] focus:outline-none focus:border-brand-500"
                    >
                      <option value="manager">{isAr ? 'مدير' : 'Manager'}</option>
                      <option value="staff">{isAr ? 'موظف' : 'Staff'}</option>
                    </select>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="btn-ghost text-red-400 hover:text-red-300 py-1 px-2"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Role legend */}
      <div className="card bg-[#0f0e0c]">
        <h3 className="section-title">{isAr ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}</h3>
        <div className="space-y-2">
          {[
            {
              role: isAr ? '👑 مالك' : '👑 Owner',
              desc: isAr ? 'صلاحيات كاملة لجميع الميزات' : 'Full access to all features',
            },
            {
              role: isAr ? '🛡 مدير' : '🛡 Manager',
              desc: isAr ? 'إدارة القائمة والطلبات والطاولات والتحليلات' : 'Manage menu, orders, tables, analytics',
            },
            {
              role: isAr ? '👤 موظف' : '👤 Staff',
              desc: isAr ? 'عرض وتحديث الطلبات وشاشة المطبخ فقط' : 'View and update orders + kitchen display only',
            },
          ].map((item) => (
            <div key={item.role} className="flex gap-3 text-sm">
              <span className="text-[#a8a29e] font-medium w-24 flex-shrink-0">{item.role}</span>
              <span className="text-[#57534e]">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
