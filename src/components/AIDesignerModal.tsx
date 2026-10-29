import React, { useState } from 'react';
import { Sparkles, Heart, Check, X, RefreshCw, ArrowRight, Wand2, Palette } from 'lucide-react';
import { AIDesignProposal, WeddingTemplate } from '../types/wedding';
import { generateAIDesign } from '../utils/api';
import { WEDDING_TEMPLATES } from '../data/templates';
import { TemplateThumb } from './TemplateThumb';

interface AIDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProposal: (proposal: AIDesignProposal) => void;
}

export const AIDesignerModal: React.FC<AIDesignerModalProps> = ({
  isOpen,
  onClose,
  onApplyProposal,
}) => {
  const [brideName, setBrideName] = useState('Minh Anh');
  const [groomName, setGroomName] = useState('Quốc Bảo');
  const [stylePreference, setStylePreference] = useState('Pastel Luxury');
  const [tone, setTone] = useState('Lãng mạn, sâu lắng và thi vị');
  const [notes, setNotes] = useState('Tiệc cưới ấm cúng tại Sài Gòn');

  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<AIDesignProposal[]>([]);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [variation, setVariation] = useState(0);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brideName.trim() || !groomName.trim()) return;

    setLoading(true);
    try {
      const res = await generateAIDesign({
        brideName,
        groomName,
        stylePreference,
        tone,
        notes,
      }, variation);
      setVariation((v) => v + 1);
      setProposals(res.proposals);
      setIsAIGenerated(res.isAIGenerated);
    } catch (err) {
      console.error(err);
      alert('Không thể tạo phương án lúc này. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-[#E8B7C8]/40">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6DCE5]/60 text-[#C76A82] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Gemini AI Wedding Designer</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] tracking-tight">
            Thiết Kế Thiệp Cưới Bằng Trí Tuệ Nhân Tạo
          </h2>
          <p className="text-xs sm:text-sm text-[#827580] mt-2">
            Chỉ cần cung cấp tên hai bạn, AI sẽ tự động phân tích và tạo ngay 3 phương án phối màu, layout và lời mời độc bản.
          </p>
        </div>

        {/* Input Form */}
        {proposals.length === 0 ? (
          <form onSubmit={handleGenerate} className="max-w-xl mx-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#453C45] mb-1">
                  Tên Chú Rể <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quốc Bảo"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#453C45] mb-1">
                  Tên Cô Dâu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Minh Anh"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#453C45] mb-1">
                Phong Cách Yêu Thích
              </label>
              <select
                value={stylePreference}
                onChange={(e) => setStylePreference(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50 bg-white"
              >
                <option value="Pastel Luxury">Pastel Luxury (Hồng phấn & Rose Pastel lãng mạn)</option>
                <option value="Korean Minimal">Korean Minimalist (Hàn Quốc nhẹ nhàng, thanh lịch)</option>
                <option value="Luxury Champagne">Luxury Champagne (Ánh kim champagne thượng lưu)</option>
                <option value="Floral Garden">Floral Garden (Sân vườn hoa cỏ tươi mát)</option>
                <option value="Traditional Heritage">Áo Dài Truyền Thống (Đỏ son may mắn & Sen vàng)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#453C45] mb-1">
                Tông Giọng Thi Văn Lời Mời
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Lãng mạn, sâu lắng, hóm hỉnh hay sang trọng..."
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#453C45] mb-1">
                Ghi chú về tiệc cưới (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Tiệc tối bên bãi biển, tiệc sân vườn, lễ ăn hỏi truyền thống..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4899C] to-[#C76A82] hover:from-[#C76A82] hover:to-[#B0596E] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang phác thảo 3 phương án thiết kế...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Tạo 3 Phương Án Thiết Kế Ngay</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Proposals Display Area */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#827580]">
                {isAIGenerated
                  ? '✨ Được tạo theo thời gian thực bởi Gemini AI'
                  : `🌿 Gợi ý thông minh từ ${WEDDING_TEMPLATES.length}+ mẫu thiệp theo phong cách & tông giọng của bạn`}
              </span>
              <button
                onClick={() => setProposals([])}
                className="text-xs text-[#C76A82] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Thử tạo lại với thông tin khác
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {proposals.map((prop, idx) => (
                <div
                  key={prop.id || idx}
                  className="rounded-2xl p-5 border border-[#E8B7C8]/40 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                  style={{ backgroundColor: prop.palette?.background || '#FFFBF7' }}
                >
                  <div className="space-y-3">
                    {(() => {
                      const tpl = prop.templateId ? WEDDING_TEMPLATES.find((t) => t.id === prop.templateId) : undefined;
                      return tpl ? (
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md -mx-1">
                          <TemplateThumb template={tpl} names={[groomName, brideName]} />
                        </div>
                      ) : null;
                    })()}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C76A82] px-2 py-0.5 rounded-full bg-[#F6DCE5]/60">
                        Phương án 0{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#827580]">
                        {prop.styleName}
                      </span>
                    </div>

                    <h4
                      className="font-heading text-lg font-bold"
                      style={{ color: prop.palette?.primary || '#453C45' }}
                    >
                      {prop.title}
                    </h4>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: prop.palette?.primary }} />
                      <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: prop.palette?.secondary }} />
                      <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: prop.palette?.surface }} />
                      <span className="text-[11px] text-neutral-500 ml-1">Bảng màu chuẩn</span>
                    </div>

                    <p className="text-xs text-[#827580] leading-relaxed">
                      {prop.concept}
                    </p>

                    {/* AI Written Poetry Sample */}
                    <div className="p-3 rounded-xl bg-white/70 border border-neutral-200/60 shadow-inner">
                      <span className="text-[10px] uppercase font-bold text-[#827580] block mb-1">
                        Lời mời do AI chắp bút:
                      </span>
                      <p className="text-xs italic text-[#453C45] line-clamp-4 leading-relaxed">
                        "{prop.invitationMessage}"
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onApplyProposal(prop);
                      onClose();
                    }}
                    className="mt-5 w-full py-2.5 rounded-xl text-white text-xs font-bold transition-transform hover:scale-[1.02] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: prop.palette?.primary || '#C76A82' }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Chọn Phương Án Này
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
