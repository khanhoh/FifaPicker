import React from 'react';
import { X, ShieldCheck, Clock, Users, Award, Ban } from 'lucide-react';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c121e] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111928]">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-neon-green" />
            <h2 className="text-xl font-bold text-white tracking-wide">LUẬT THI ĐẤU & CƠ CHẾ DRAFT / CẤM CẦU THỦ</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Section 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#141d2d] rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-neon-green font-bold text-base mb-2">
                <Users className="w-5 h-5" /> 1. SỐ LƯỢNG ĐỘI & THỨ TỰ SNAKE
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Mỗi room có đúng bốn đội cố định: <strong>AMT, NK, FFB và TAG</strong>. Người chơi được phân ngẫu nhiên và có thể swap đội tại Lobby.</li>
                <li><strong>Thứ tự Snake Draft</strong>:
                  <div className="mt-1 text-xs bg-slate-900/80 p-2 rounded border border-slate-700 font-mono text-neon-cyan">
                    Vòng lẻ (1, 3, 5, 7, 9, 11, 13): 1 ➔ 2 ➔ 3 ➔ 4<br />
                    Vòng chẵn (2, 4, 6, 8, 10, 12): 4 ➔ 3 ➔ 2 ➔ 1
                  </div>
                </li>
                <li>Mỗi đội pick tổng cộng <strong>23 cầu thủ</strong> (11 chính + 12 dự bị).</li>
                <li>Mất kết nối không làm Draft tạm dừng. Đồng hồ vẫn chạy và đội không kịp reconnect sẽ <strong>mất số pick còn lại của lượt đó</strong>.</li>
                <li><strong>Pick Độc Quyền</strong>: 1 cầu thủ chỉ được chọn bởi 1 đội trên toàn bộ các mùa thẻ.</li>
              </ul>
            </div>

            <div className="p-4 bg-[#141d2d] rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base mb-2">
                <Award className="w-5 h-5" /> 2. QUỸ LƯƠNG & THỦ MÔN (GK)
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><strong>Quỹ lương Đội hình chính</strong>: Tổng lương 11 cầu thủ $\le$ <strong className="text-amber-400">305</strong> (dựa trên thuộc tính <code>attrA</code> trong API).</li>
                <li><strong>Yêu cầu Thủ Môn (GK)</strong>:
                  <ul className="list-circle list-inside pl-4 text-xs space-y-0.5 text-slate-400 mt-1">
                    <li>Đội hình chính (11 người): Có ít nhất <strong>1 GK</strong>.</li>
                    <li>Toàn đội (23 người): Có ít nhất <strong>2 GK</strong>.</li>
                  </ul>
                </li>
                <li><strong>Tính OVR</strong>: OVR hiển thị = OVR gốc + Điểm cộng thẻ tối đa theo file Excel.</li>
              </ul>
            </div>
          </div>

          {/* Section 2: Table of Rounds */}
          <div className="p-4 bg-[#141d2d] rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-neon-cyan font-bold text-base mb-3">
              <Clock className="w-5 h-5" /> 3. CHI TIẾT CÁC VÒNG PICK & THỜI GIAN
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-700">
                    <th className="p-2">Giai đoạn</th>
                    <th className="p-2">Vòng</th>
                    <th className="p-2">Số cầu thủ / lượt</th>
                    <th className="p-2">Thời gian</th>
                    <th className="p-2">Tích lũy</th>
                    <th className="p-2">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/40">
                    <td rowSpan={8} className="p-2 font-bold text-neon-green bg-slate-900/40 border-r border-slate-800">
                      ROUND 1<br /><span className="text-[10px] text-slate-400 font-normal">Đội hình chính (11)</span>
                    </td>
                    <td className="p-2 font-semibold text-white">1R - 3R</td>
                    <td className="p-2 text-neon-green font-bold">1 cầu thủ</td>
                    <td className="p-2">30 giây</td>
                    <td className="p-2">3 cầu thủ</td>
                    <td className="p-2 text-slate-400">Lương $\le 305$</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2 font-semibold text-white">4R - 7R</td>
                    <td className="p-2 text-neon-green font-bold">2 cầu thủ</td>
                    <td className="p-2">60 giây</td>
                    <td className="p-2">11 cầu thủ</td>
                    <td className="p-2 text-slate-400">Pick lần lượt từng người</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40 bg-amber-950/20">
                    <td className="p-2 font-semibold text-amber-300">8R</td>
                    <td className="p-2 text-amber-300 font-bold">Bù cho đủ (3 ô)</td>
                    <td className="p-2">30 giây</td>
                    <td className="p-2">11 cầu thủ</td>
                    <td className="p-2 text-amber-400">Tự động <strong>SKIP</strong> nếu đã đủ 11 thẻ.</td>
                  </tr>

                  <tr className="hover:bg-slate-800/40">
                    <td rowSpan={5} className="p-2 font-bold text-neon-cyan bg-slate-900/40 border-r border-slate-800">
                      ROUND 2<br /><span className="text-[10px] text-slate-400 font-normal">Dự bị (+12 = 23)</span>
                    </td>
                    <td className="p-2 font-semibold text-white">-1R (2.1)</td>
                    <td className="p-2 text-neon-cyan font-bold">2 cầu thủ</td>
                    <td className="p-2">60 giây</td>
                    <td className="p-2">13 cầu thủ</td>
                    <td className="p-2 text-slate-400">Pick dự bị</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2 font-semibold text-white">-2R (2.2)</td>
                    <td className="p-2 text-neon-cyan font-bold">2 cầu thủ</td>
                    <td className="p-2">60 giây</td>
                    <td className="p-2">15 cầu thủ</td>
                    <td className="p-2 text-slate-400">Pick dự bị</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2 font-semibold text-white">-3R (2.3)</td>
                    <td className="p-2 text-neon-cyan font-bold">3 cầu thủ</td>
                    <td className="p-2">90 giây</td>
                    <td className="p-2">18 cầu thủ</td>
                    <td className="p-2 text-slate-400">Pick dự bị</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2 font-semibold text-white">-4R (2.4)</td>
                    <td className="p-2 text-neon-cyan font-bold">2 cầu thủ</td>
                    <td className="p-2">60 giây</td>
                    <td className="p-2">20 cầu thủ</td>
                    <td className="p-2 text-slate-400">Pick dự bị</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-2 font-semibold text-white">-5R (2.5)</td>
                    <td className="p-2 text-neon-cyan font-bold">3 cầu thủ</td>
                    <td className="p-2">90 giây</td>
                    <td className="p-2 text-neon-green font-bold">23 cầu thủ</td>
                    <td className="p-2 text-neon-green">Bắt buộc toàn đội đủ $\ge$ 2 GK</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Match Ban Phase Rules */}
          <div className="p-4 bg-[#141d2d] rounded-xl border border-red-800/80">
            <div className="flex items-center gap-2 text-red-400 font-bold text-base mb-2">
              <Ban className="w-5 h-5" /> 4. LUẬT CẤM CẦU THỦ TRƯỚC MỖI TRẬN ĐẤU ĐƠN
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li><strong>Số lượng cấm</strong>: Trước mỗi trận đấu đơn, mỗi đội được quyền cấm đúng <strong>5 cầu thủ</strong> của đối phương.</li>
              <li><strong>Giới hạn theo vị trí</strong>:
                <ul className="list-circle list-inside pl-4 text-xs space-y-0.5 text-amber-300 mt-0.5">
                  <li>Tối đa <strong>2 Tiền đạo (FW)</strong></li>
                  <li>Tối đa <strong>2 Tiền vệ (MF)</strong></li>
                  <li>Tối đa <strong>2 Hậu vệ (DF)</strong></li>
                  <li><strong className="text-red-400 underline">KHÔNG ĐƯỢC PHÉP CẤM THỦ MÔN (GK)</strong>.</li>
                </ul>
              </li>
              <li><strong>Không cấm trùng 2 trận liên tiếp</strong>: Không được phép cấm cầu thủ đã bị cấm ở trận liền trước đó.</li>
              <li><strong>Giới hạn số lần cấm trong loạt trận</strong>:
                <ul className="list-circle list-inside pl-4 text-xs space-y-0.5 text-slate-400 mt-0.5">
                  <li>Loạt trận <strong>BO5</strong>: Mỗi cầu thủ chỉ được cấm tối đa <strong>2 lần</strong>.</li>
                  <li>Loạt trận <strong>BO7</strong>: Mỗi cầu thủ chỉ được cấm tối đa <strong>3 lần</strong>.</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Section 5: Post-ban lineup */}
          <div className="p-4 bg-[#141d2d] rounded-xl border border-emerald-800/80">
            <div className="flex items-center gap-2 text-neon-green font-bold text-base mb-2">
              <ShieldCheck className="w-5 h-5" /> 5. XẾP ĐỘI HÌNH SAU KHI CẤM
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li>Mỗi đội chọn sơ đồ và xếp đúng <strong>11 cầu thủ</strong> từ danh sách 23 cầu thủ đã Draft.</li>
              <li>Các cầu thủ bị đối phương cấm trong game hiện tại <strong className="text-red-400">không được sử dụng</strong>.</li>
              <li>Đội hình phải có <strong>Thủ môn tại vị trí GK</strong> và tổng lương không vượt quá <strong className="text-amber-400">305</strong>.</li>
              <li>Một cầu thủ chỉ được xuất hiện ở một vị trí. Hai đội phải khóa đội hình trước khi Trọng tài chuyển sang game tiếp theo.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#111928] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neon-green hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition"
          >
            ĐÃ HIỂU LUẬT
          </button>
        </div>
      </div>
    </div>
  );
}
