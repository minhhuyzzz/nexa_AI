'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  User,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  Award,
  Trophy,
  ArrowRight,
  ExternalLink,
  Download,
  Loader2,
  Sparkles,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfileData {
  id: string;
  nickname: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  isGoogleAuth: boolean;
  points: number;
  levelNumber: number;
  levelCode: string;
  levelNextTarget: number;
}

interface CredentialItem {
  id: string;
  credential_id: string;
  level: string;
  hash: string;
  issued_at: string;
}

export default function LearnerProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [nickname, setNickname] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/personal/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setNickname(data.profile.nickname || '');
        }
        if (data.credentials) {
          setCredentials(data.credentials);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh vượt quá 3MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = user?.id || profile?.id;
      if (!targetUserId) throw new Error('Không xác định được danh tính người dùng');

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `${targetUserId}/${Date.now()}.${fileExt}`;
      let finalAvatarUrl: string | null = null;

      // 1. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        finalAvatarUrl = publicUrl;
      } else {
        // Fallback to base64
        finalAvatarUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // 2. Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: finalAvatarUrl, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      if (updateError) throw updateError;

      if (profile) {
        setProfile({ ...profile, avatarUrl: finalAvatarUrl });
      }
      setSuccessMsg('Đã cập nhật ảnh đại diện thành công!');
      window.dispatchEvent(new Event('profile-updated'));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi tải ảnh lên');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = user?.id || profile?.id;
      if (!targetUserId) throw new Error('Không xác định được danh tính người dùng');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      if (updateError) throw updateError;

      if (profile) {
        setProfile({ ...profile, avatarUrl: null });
      }
      setSuccessMsg('Đã gỡ ảnh đại diện!');
      window.dispatchEvent(new Event('profile-updated'));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi gỡ ảnh');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const cleanNickname = nickname.trim().replace(/\s+/g, ' ');

    if (cleanNickname.length < 2 || cleanNickname.length > 30) {
      setErrorMsg('Biệt danh phải từ 2 đến 30 ký tự.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch('/api/personal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: cleanNickname,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi lưu thông tin');
      }

      if (profile) {
        setProfile({
          ...profile,
          nickname: cleanNickname,
        });
      }

      setSuccessMsg('Thông tin hồ sơ đã được lưu thành công!');
      window.dispatchEvent(new Event('profile-updated'));
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi khi lưu hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  };

  // Avatar Initials
  const initials = (profile?.nickname || nickname || 'Học Viên Nexa')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'NX';

  const currentPoints = profile?.points ?? 0;
  const levelTarget = profile?.levelNextTarget ?? 150;
  const levelProgressPct = Math.min(100, Math.round((currentPoints / levelTarget) * 100));

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600 mb-2" strokeWidth={1.75} />
        <p className="text-xs">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            HỒ SƠ CÁ NHÂN
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Cài Đặt Hồ Sơ Người Học
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý thông tin định danh, biệt danh công khai và theo dõi tiến trình phát triển năng lực số.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CARD 1: Identity & Profile Form */}
      <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">
              Thông Tin Định Danh
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            ID: {profile?.id ? profile.id.slice(0, 8) : 'NX-LEARNER'}
          </span>
        </div>

        {/* Avatar Section */}
        <div className="flex items-center gap-5">
          <div className="relative group w-18 h-18 rounded-full bg-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs font-mono overflow-hidden border border-slate-200">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px]">
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <label
                htmlFor="avatar-file-input"
                className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                <span>{profile?.avatarUrl ? 'Thay đổi ảnh' : 'Tải ảnh đại diện'}</span>
              </label>
              <input
                id="avatar-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />

              {profile?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Gỡ ảnh</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Hỗ trợ tệp PNG, JPG hoặc WebP. Kích thước tối đa 3MB.
            </p>
          </div>
        </div>

        {/* Edit Form: Biệt danh */}
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div>
            <label htmlFor="profile-nickname" className="block text-xs font-semibold text-slate-800 mb-1">
              Biệt danh hiển thị
            </label>
            <input
              id="profile-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ví dụ: Trần Minh Huy"
              className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-sky-600 bg-white text-slate-900"
              required
              minLength={2}
              maxLength={30}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Tên công khai trên Bảng xếp hạng và trong các Nhóm học tập. Không được trùng với người
              dùng khác.
            </p>
          </div>

          {/* Email & Auth Provider */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Email tài khoản &amp; Phương thức đăng nhập
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                <span className="text-xs font-mono text-slate-800">{profile?.email}</span>
              </div>

              {profile?.isGoogleAuth ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-slate-800 text-[11px] font-medium border border-slate-200 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" strokeWidth={1.75} />
                  <span>Tài khoản Google (OAuth)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-emerald-800 text-[11px] font-medium border border-emerald-200 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                  <span>Email đã xác thực</span>
                </span>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3 flex items-center justify-end border-t border-slate-100">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu thay đổi hồ sơ</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* CARD 2: Competency Level & Progress */}
      <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">
              Cấp Độ &amp; Điểm Tích Lũy
            </h2>
          </div>
          <Link
            href="/personal/leaderboard"
            className="text-[11px] text-sky-600 hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Bảng xếp hạng</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Level box */}
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Cấp độ hiện tại</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-1">
              {profile?.levelCode || 'Level 1: Basic'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Khung năng lực số DigComp 3.0</div>
          </div>

          {/* Points box */}
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Điểm tích lũy</div>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {currentPoints} <span className="text-xs font-normal text-slate-500">điểm</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Tích lũy từ các bài khảo thí</div>
          </div>

          {/* Target box */}
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Mục tiêu cấp tiếp theo</div>
            <div className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-1">
              {currentPoints} / {levelTarget} <span className="text-xs font-normal text-slate-500">điểm</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-sky-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${levelProgressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: Earned Digital Credentials */}
      <div className="p-5 rounded-md border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
            <h2 className="text-sm font-bold text-slate-900">
              Chứng Chỉ Số Sở Hữu
            </h2>
          </div>
          <Link
            href="/personal/credentials"
            className="text-[11px] text-sky-600 hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Quản lý chứng chỉ</span>
            <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
          </Link>
        </div>

        {credentials.length > 0 ? (
          <div className="space-y-3">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="p-4 rounded-md border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Award className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Chứng Chỉ Khung Năng Lực Số DigComp 3.0 — {cred.level || 'Level 4'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                      <span>Mã: {cred.credential_id}</span>
                      <span>•</span>
                      <span className="truncate max-w-[140px] sm:max-w-[200px]" title={cred.hash}>
                        SHA-256: {cred.hash?.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href={`/verify/${cred.credential_id}`}
                    target="_blank"
                    className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium inline-flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
                    <span>Tra cứu QR</span>
                  </Link>

                  <a
                    href={`/api/credentials/${cred.credential_id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-medium inline-flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <Download className="w-3 h-3" strokeWidth={1.75} />
                    <span>Tải PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center rounded-md border border-dashed border-slate-200 bg-slate-50/50">
            <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.75} />
            <h3 className="text-xs font-semibold text-slate-700 mb-1">
              Chưa sở hữu chứng chỉ số
            </h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mb-3 leading-relaxed">
              Chứng chỉ Khung Năng Lực Số DigComp sẽ tự động được cấp khi bạn đạt Cấp độ 4 (từ 450 điểm tích lũy trở lên).
            </p>
            <Link
              href="/personal/assessments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <span>Khám phá bài khảo thí để tích lũy điểm</span>
              <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
