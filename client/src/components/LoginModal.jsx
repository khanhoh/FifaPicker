import React, { useState } from 'react';
import { useDraft } from '../context/DraftContext';
import { ShieldCheck, Lock, ArrowRight, X, AlertCircle } from 'lucide-react';
import { TeamLogos } from '../assets/teamLogos';

const ACCOUNTS_LIST = [
  { key: 'referee', label: '🏆 TRỌNG TÀI / ADMIN', code: null, desc: 'Toàn quyền điều khiển Draft (Bắt đầu, Pause, Skip, Reset)', defaultPin: '123456' },
  { key: 'team_1', label: 'AMITA FCO', code: 'AMT', desc: 'Tài khoản Captain Đội 1 (Mã: AMT)', defaultPin: '1111' },
  { key: 'team_2', label: 'NK FC ONLINE', code: 'NK', desc: 'Tài khoản Captain Đội 2 (Mã: NK)', defaultPin: '2222' },
  { key: 'team_3', label: 'FOR FUN BROTHER', code: 'FFB', desc: 'Tài khoản Captain Đội 3 (Mã: FFB)', defaultPin: '3333' },
  { key: 'team_4', label: 'TAG TEAM', code: 'TAG', desc: 'Tài khoản Captain Đội 4 (Mã: TAG)', defaultPin: '4444' },
  { key: 'spectator', label: '📺 KHÁN GIẢ / STREAMER', code: null, desc: 'Chỉ xem toàn màn hình Live Broadcast', defaultPin: '' }
];

export default function LoginModal({ isOpen, onClose }) {
  const { loginUser } = useDraft();
  const [selectedKey, setSelectedKey] = useState('referee');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectAccount = (acc) => {
    setSelectedKey(acc.key);
    setPassword(acc.defaultPin);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (selectedKey === 'spectator') {
      loginUser({ accountKey: 'spectator', role: 'spectator', teamId: null, name: 'Khán Giả' });
      setLoading(false);
      onClose();
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountKey: selectedKey, password })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Đăng nhập thất bại');
      } else {
        loginUser(data.user);
        onClose();
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-[#0a101d] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f1728]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-neon-green" />
            <h3 className="text-lg font-black text-white tracking-wide">ĐĂNG NHẬP HỆ THỐNG DRAFT</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm text-slate-300">
          {error && (
            <div className="p-3 bg-red-950/90 border border-red-500 text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Picker */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              Chọn vai trò / Tài khoản:
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {ACCOUNTS_LIST.map((acc) => {
                const isSelected = selectedKey === acc.key;
                const LogoComp = acc.code ? TeamLogos[acc.code] : null;

                return (
                  <button
                    key={acc.key}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/50 border-neon-green text-white glow-neon-green'
                        : 'bg-[#101728] border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {LogoComp ? (
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center p-1">
                          <LogoComp className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-base">
                          {acc.key === 'referee' ? '🏆' : '📺'}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-black text-white">{acc.label}</div>
                        <div className="text-[11px] text-slate-400">{acc.desc}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-neon-green shrink-0 shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Input */}
          {selectedKey !== 'spectator' && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                Mật khẩu / Mã PIN:
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Nhập mật khẩu hoặc mã PIN..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#101728] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-green"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Gợi ý: Trọng tài (<code>123456</code>), AMITA (<code>1111</code>), NK (<code>2222</code>), FFB (<code>3333</code>), TAG (<code>4444</code>).
              </div>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neon-green hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider transition shadow-lg glow-neon-green flex items-center justify-center gap-2 active:scale-98"
            >
              <span>{loading ? 'Đang xác thực...' : 'XÁC NHẬN ĐĂNG NHẬP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
