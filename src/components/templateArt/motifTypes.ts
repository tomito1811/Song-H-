export interface ArtColors {
  ground: string;
  ink: string;
  metal: string;
  soft: string;
  text: string;
}

export interface MotifProps {
  c: ArtColors;
  uid: string;
  variant?: string;
}

/** Vùng chữ & phong cách typography riêng của từng motif (đơn vị % theo khung 3:4). */
export interface MotifLayout {
  box: { top: number; bottom: number; left: number; right: number };
  kicker: string;
  kickerFont: string;
  nameFont: string;
  nameWeight: number;
  nameSize: number; // cqw
  nameCase?: 'upper' | 'none';
  ampFont: string;
  ampText?: string;
  metaFont: string;
  nameColor: 'ink' | 'metal' | 'text';
  accentColor: 'ink' | 'metal' | 'text';
  /** Nền mờ phía sau chữ (vd. thiệp có họa tiết dày). */
  panel?: 'none' | 'soft' | 'ground';
  monogram?: boolean;
  /** Khoảng cách giữa các khối chữ (cqw), mặc định 2.2. */
  gap?: number;
  /** Vùng riêng cho địa điểm (khi bố cục chính quá chật). */
  venueBox?: { top: number; bottom: number; left: number; right: number };
  divider?: 'line' | 'dots' | 'diamond' | 'leaf' | 'heart' | 'none';
}
