import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CreditCard,
  CheckCircle,
  Clock,
  ExternalLink,
  Trash2,
  Download,
  Search,
  Filter,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import { WeddingInvitation, Order, User, AdminAction } from '../types/wedding';
import {
  fetchInvitations,
  fetchOrders,
  deleteInvitation,
  approveOrderManually,
  fetchAdminUsers,
  fetchAdminActions,
} from '../utils/api';
import { formatVND, formatDateVN } from '../utils/formatters';
import { auth } from '../firebase';

interface AdminViewProps {
  onBackToHome: () => void;
  onOpenPublicInvite: (slug: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onBackToHome, onOpenPublicInvite }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'invitations' | 'admin_actions'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [invitations, setInvitations] = useState<WeddingInvitation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);

  // User CRM search & filter state
  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('all');

  // Manual Approve Modal state
  const [approveModalOrder, setApproveModalOrder] = useState<Order | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordList, invList, userData, actionList] = await Promise.all([
        fetchOrders(),
        fetchInvitations(),
        fetchAdminUsers(userSearch, userPlanFilter),
        fetchAdminActions(),
      ]);
      setOrders(ordList);
      setInvitations(invList);
      setUsers(userData.users);
      setAdminActions(actionList);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminUsers(userSearch, userPlanFilter);
      setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModalOrder) return;
    setIsApproving(true);
    try {
      const updated = await approveOrderManually(approveModalOrder.id, approveNote);
      setOrders(orders.map(o => (o.id === approveModalOrder.id ? updated : o)));
      setApproveModalOrder(null);
      setApproveNote('');
      alert('Đã duyệt đơn và kích hoạt gói thành công cho người dùng!');
      // Reload users to update plan
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi duyệt đơn hàng');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeleteInv = async (id: string) => {
    if (!confirm('Xóa thiệp này khỏi hệ thống? Thao tác không thể hoàn tác.')) return;
    try {
      await deleteInvitation(id);
      setInvitations(invitations.filter(i => i.id !== id));
    } catch (err) {
      alert('Lỗi xóa thiệp');
    }
  };

  const handleDownloadCsv = async (type: 'users' | 'orders') => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/export/${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Không thể tải CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `THIEPONL_${type === 'users' ? 'KhachHang' : 'DonHang'}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Lỗi xuất tệp CSV');
    }
  };

  const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'manual_approved' || o.status === 'completed');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#453C45] text-white flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#E8B7C8]" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#453C45]">
              Hệ Thống Quản Trị Vận Hành — THIEPONL
            </h1>
            <p className="text-xs text-[#827580]">
              Quản lý khách hàng, giao dịch SePay TPBank, duyệt đơn thủ công và giám sát thiệp cưới.
            </p>
          </div>
        </div>

        <button
          onClick={onBackToHome}
          className="px-3.5 py-1.5 rounded-xl border border-neutral-300 text-xs font-semibold text-[#453C45] hover:bg-neutral-50 cursor-pointer"
        >
          Thoát Admin
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-[#827580] block mb-1">Tổng Doanh Thu Thực Nhận</span>
          <span className="font-heading text-2xl font-bold text-emerald-700 tabular-nums">
            {formatVND(totalRevenue)}
          </span>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-[#827580] block mb-1">Đơn Chờ Xác Nhận</span>
          <span className="font-heading text-2xl font-bold text-amber-600 tabular-nums">
            {orders.filter(o => o.status === 'pending').length} đơn
          </span>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-[#827580] block mb-1">Tổng Số Khách Hàng (CRM)</span>
          <span className="font-heading text-2xl font-bold text-[#C76A82] tabular-nums">
            {users.length} người dùng
          </span>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <span className="text-xs text-[#827580] block mb-1">Tổng Số Thiệp Toàn Hệ Thống</span>
          <span className="font-heading text-2xl font-bold text-[#453C45] tabular-nums">
            {invitations.length} thiệp
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 gap-6 text-sm font-semibold text-[#827580]">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'orders' ? 'border-b-2 border-[#C76A82] text-[#C76A82]' : 'hover:text-[#453C45]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Đơn Hàng & SePay ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users' ? 'border-b-2 border-[#C76A82] text-[#C76A82]' : 'hover:text-[#453C45]'
          }`}
        >
          <Users className="w-4 h-4" />
          Khách Hàng (CRM) ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`pb-3 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'invitations' ? 'border-b-2 border-[#C76A82] text-[#C76A82]' : 'hover:text-[#453C45]'
          }`}
        >
          <ExternalLink className="w-4 h-4" />
          Thiệp Cưới Hệ Thống ({invitations.length})
        </button>
        <button
          onClick={() => setActiveTab('admin_actions')}
          className={`pb-3 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'admin_actions' ? 'border-b-2 border-purple-600 text-purple-700 font-bold' : 'hover:text-[#453C45]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          Nhật Ký Admin Miễn Phí ({adminActions.length})
        </button>
      </div>

      {/* Tab 1: Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#827580]">
              Danh sách đơn hàng nâng cấp gói qua mã SePay TPBank và phê duyệt thủ công.
            </p>
            <button
              onClick={() => handleDownloadCsv('orders')}
              className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-[#453C45] flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Xuất CSV Đơn Hàng
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F5] border-b border-neutral-200 text-[#827580] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn</th>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Gói</th>
                    <th className="py-3 px-4">Số Tiền</th>
                    <th className="py-3 px-4">Mã CK (VietQR)</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4">Ghi Chú / Người Duyệt</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-[#453C45]">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-50/70">
                      <td className="py-3 px-4 font-mono font-bold">#{ord.id}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold block">{ord.userName}</span>
                        <span className="text-[11px] text-[#827580]">{ord.userEmail}</span>
                      </td>
                      <td className="py-3 px-4 uppercase font-bold text-[#C76A82]">{ord.planId}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{formatVND(ord.amount)}</td>
                      <td className="py-3 px-4 font-mono bg-yellow-50 px-2 py-0.5 rounded text-neutral-800">
                        {ord.bankReference}
                      </td>
                      <td className="py-3 px-4">
                        {ord.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle className="w-3 h-3" /> SePay Đã Nhận
                          </span>
                        ) : ord.status === 'manual_approved' ? (
                          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                            <Check className="w-3 h-3" /> Admin Duyệt Tay
                          </span>
                        ) : ord.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle className="w-3 h-3" /> Hoàn tất
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                            <Clock className="w-3 h-3" /> Chờ chuyển khoản
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#827580]">{formatDateVN(ord.createdAt)}</td>
                      <td className="py-3 px-4 text-[11px] text-[#827580]">
                        {ord.approvedBy ? (
                          <div>
                            <span className="font-semibold text-[#453C45]">{ord.approvedBy}</span>
                            <span className="block text-[10px]">{formatDateVN(ord.approvedAt || '')}</span>
                          </div>
                        ) : (
                          ord.proofNote || '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ord.status === 'pending' && (
                          <button
                            onClick={() => {
                              setApproveModalOrder(ord);
                              setApproveNote(`Đã kiểm tra sao kê TPBank khớp số tiền ${formatVND(ord.amount)}`);
                            }}
                            className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 cursor-pointer text-[11px] shadow-2xs"
                          >
                            Duyệt Tay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users (CRM) Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo email hoặc tên khách hàng..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilterUsers()}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
                />
              </div>
              <button
                type="button"
                onClick={handleFilterUsers}
                className="px-3 py-1.5 bg-[#453C45] text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 cursor-pointer"
              >
                Tìm
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-[#827580]">
                <Filter className="w-3.5 h-3.5" />
                <span>Gói:</span>
              </div>
              <select
                value={userPlanFilter}
                onChange={(e) => {
                  setUserPlanFilter(e.target.value);
                  setTimeout(handleFilterUsers, 50);
                }}
                className="py-1.5 px-3 rounded-xl border border-neutral-300 text-xs bg-white text-[#453C45] focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50 cursor-pointer"
              >
                <option value="all">Tất cả các gói</option>
                <option value="free">Gói Miễn Phí (Free)</option>
                <option value="premium">Gói Premium</option>
                <option value="luxury">Gói Luxury</option>
              </select>

              <button
                onClick={() => handleDownloadCsv('users')}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-[#453C45] flex items-center gap-1.5 cursor-pointer shadow-xs ml-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Xuất CSV Khách Hàng
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F5] border-b border-neutral-200 text-[#827580] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Khách Hàng</th>
                    <th className="py-3 px-4">Gói Bản Quyền</th>
                    <th className="py-3 px-4">Thời Hạn Gói</th>
                    <th className="py-3 px-4">Ngày Đăng Ký</th>
                    <th className="py-3 px-4">Đăng Nhập Cuối</th>
                    <th className="py-3 px-4">Điều Khoản</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-[#453C45]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50/70">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#F6DCE5] text-[#C76A82] font-bold flex items-center justify-center text-xs">
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold block">{u.displayName || u.name || 'Cặp Đôi'}</span>
                            <span className="text-[11px] text-[#827580] font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.plan === 'luxury'
                              ? 'bg-[#E9D8BD]/40 text-[#8E6F3E]'
                              : u.plan === 'premium'
                              ? 'bg-[#F6DCE5] text-[#C76A82]'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {u.plan}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#827580]">
                        {u.planExpiresAt ? formatDateVN(u.planExpiresAt) : 'Vĩnh viễn (Free)'}
                      </td>
                      <td className="py-3 px-4 text-[#827580]">{formatDateVN(u.createdAt)}</td>
                      <td className="py-3 px-4 text-[#827580]">{u.lastLoginAt ? formatDateVN(u.lastLoginAt) : '—'}</td>
                      <td className="py-3 px-4">
                        {u.acceptedTermsAt ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-medium">
                            ✓ Đã đồng ý
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[10px]">Chưa xác nhận</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F5] border-b border-neutral-200 text-[#827580] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Tiêu Đề Thiệp</th>
                  <th className="py-3 px-4">Cặp Đôi</th>
                  <th className="py-3 px-4">Ngày Cưới</th>
                  <th className="py-3 px-4">Lượt Xem</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-[#453C45]">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/70">
                    <td className="py-3 px-4 font-semibold">{inv.title}</td>
                    <td className="py-3 px-4">
                      {inv.groomName} & {inv.brideName}
                    </td>
                    <td className="py-3 px-4">{formatDateVN(inv.weddingDate)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#C76A82]">{inv.viewsCount || 0}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {inv.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => onOpenPublicInvite(inv.slug)}
                        className="p-1 text-neutral-500 hover:text-[#C76A82] cursor-pointer"
                        title="Mở thiệp"
                      >
                        <ExternalLink className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteInv(inv.id)}
                        className="p-1 text-neutral-400 hover:text-red-500 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Admin Actions (Free Publish Audit Log) */}
      {activeTab === 'admin_actions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#827580]">
              Nhật ký kiểm toán các thiệp cưới được Quản Trị Viên xuất bản miễn phí (gán gói tặng hoặc tạo hộ khách, không tính vào doanh thu).
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            {adminActions.length === 0 ? (
              <div className="text-center py-12 text-[#827580] text-xs">
                Chưa có thiệp nào được xuất bản qua đặc quyền Admin.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F5] border-b border-neutral-200 text-[#827580] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Quản Trị Viên</th>
                      <th className="py-3 px-4">Thiệp Cưới</th>
                      <th className="py-3 px-4">Gói Gán</th>
                      <th className="py-3 px-4">Thời Gian</th>
                      <th className="py-3 px-4">Ghi Chú</th>
                      <th className="py-3 px-4 text-right">Xem Thiệp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {adminActions.map((act) => (
                      <tr key={act.id} className="hover:bg-neutral-50/70">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#453C45]">{act.adminEmail}</div>
                          <div className="text-[10px] text-[#827580]">{act.adminName || 'Admin'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#453C45]">
                            {act.invitationTitle || 'Thiệp Cưới'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              act.assignedPlan === 'luxury'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : act.assignedPlan === 'premium'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                            }`}
                          >
                            {act.assignedPlan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#827580]">
                          {formatDateVN(act.timestamp)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium text-[10px] border border-purple-200">
                            Miễn thanh toán • 0đ doanh thu
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {(act.invitationSlug || act.invitationId) && (
                            <button
                              onClick={() => onOpenPublicInvite(act.invitationSlug || act.invitationId!)}
                              className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-[#453C45] cursor-pointer inline-flex items-center gap-1"
                              title="Mở xem thiệp công khai"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#C76A82]" />
                              <span className="text-[11px] font-medium">Mở thiệp</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Approval Modal */}
      {approveModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#E8B7C8]/40">
            <h3 className="font-heading font-bold text-lg text-[#453C45]">
              Duyệt Đơn Hàng Thủ Công
            </h3>
            <p className="text-xs text-[#827580]">
              Bạn đang duyệt thủ công đơn hàng <strong>#{approveModalOrder.id}</strong> của khách hàng{' '}
              <strong>{approveModalOrder.userEmail}</strong>. Gói <strong>{approveModalOrder.planId.toUpperCase()}</strong>{' '}
              sẽ được kích hoạt 12 tháng.
            </p>

            <form onSubmit={handleManualApproveSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#453C45] mb-1">
                  Lý do duyệt tay / Ghi chú đối soát
                </label>
                <textarea
                  required
                  rows={3}
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="Ví dụ: Khách hàng chuyển khoản đúng số tiền qua TPBank nhưng nội dung thiếu chữ TOP..."
                  className="w-full p-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModalOrder(null)}
                  className="flex-1 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-[#453C45] hover:bg-neutral-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isApproving}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
                >
                  {isApproving ? 'Đang duyệt...' : 'Xác Nhận Kích Hoạt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
