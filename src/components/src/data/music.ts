/**
 * Thư viện nhạc nền đám cưới.
 * Tất cả đều là bản ghi được phép dùng: Public domain (ban nhạc quân đội Hoa Kỳ)
 * hoặc CC BY 3.0 (Kevin MacLeod – incompetech.com, cần ghi công — đã ghi trong `credit`).
 * File lưu trên Wikimedia Commons (hỗ trợ CORS, phát trực tiếp).
 */
export interface WeddingTrack {
  id: string;
  title: string;
  artist: string;
  mood: 'lang-man' | 'trang-trong' | 'nhe-nhang' | 'vui-tuoi';
  url: string;
  credit: string;
}

const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons';

export const MUSIC_MOODS: { id: WeddingTrack['mood'] | 'all'; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'lang-man', label: 'Lãng mạn' },
  { id: 'trang-trong', label: 'Trang trọng' },
  { id: 'nhe-nhang', label: 'Nhẹ nhàng' },
  { id: 'vui-tuoi', label: 'Vui tươi' },
];

export const WEDDING_TRACKS: WeddingTrack[] = [
  {
    id: 'canon-strings',
    title: 'Canon in D (Pachelbel) – Dàn dây',
    artist: 'U.S. Air Force Strolling Strings',
    mood: 'lang-man',
    url: `${COMMONS}/1/12/Canon_%282004%29_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3`,
    credit: 'Public domain – U.S. Air Force Band',
  },
  {
    id: 'canon-piano',
    title: 'Canon in D – Bản hòa tấu',
    artist: 'Kevin MacLeod',
    mood: 'lang-man',
    url: `${COMMONS}/c/c6/Canon_in_D_Major_%28ISRC_USUAN1100301%29.mp3`,
    credit: 'Kevin MacLeod (incompetech.com) – CC BY 3.0',
  },
  {
    id: 'bridal-chorus',
    title: 'Bridal Chorus (Here Comes the Bride)',
    artist: 'Kevin MacLeod',
    mood: 'trang-trong',
    url: `${COMMONS}/a/a3/Wagner_Bridal_Chorus_%28ISRC_USUAN1100021%29.mp3`,
    credit: 'Kevin MacLeod (incompetech.com) – CC BY 3.0',
  },
  {
    id: 'bridal-chorus-piano',
    title: 'Bridal Chorus – Piano',
    artist: 'Kevin MacLeod',
    mood: 'nhe-nhang',
    url: `${COMMONS}/8/80/Wagner_Bridal_Chorus_-_piano_%28ISRC_USUAN1100022%29.mp3`,
    credit: 'Kevin MacLeod (incompetech.com) – CC BY 3.0',
  },
  {
    id: 'wedding-march-sousa',
    title: 'Wedding March (Sousa)',
    artist: 'U.S. Marine Band',
    mood: 'vui-tuoi',
    url: `${COMMONS}/c/ce/Sousa%27s_%22Wedding_March%22_-_United_States_Marine_Band_%282019%29.mp3`,
    credit: 'Public domain – U.S. Marine Band',
  },
  {
    id: 'air-bach',
    title: 'Air on the G String (Bach)',
    artist: 'U.S. Air Force Strings',
    mood: 'trang-trong',
    url: `${COMMONS}/e/ec/Air_-_Air_Force_Strings_-_United_States_Air_Force_Band.mp3`,
    credit: 'Public domain – U.S. Air Force Band',
  },
  {
    id: 'ave-maria',
    title: 'Ave Maria',
    artist: 'U.S. Air Force Heritage of America Band',
    mood: 'trang-trong',
    url: `${COMMONS}/3/3a/Ave_Maria_in_Due_-_Concert_Band_-_United_States_Air_Force_Heritage_of_America_Band.mp3`,
    credit: 'Public domain – U.S. Air Force Band',
  },
  {
    id: 'jesu-joy',
    title: "Jesu, Joy of Man's Desiring (Bach)",
    artist: 'Kevin MacLeod',
    mood: 'nhe-nhang',
    url: `${COMMONS}/5/51/Jesu,_Joy_of_Man%27s_Desiring_%28ISRC_USUAN1100189%29.mp3`,
    credit: 'Kevin MacLeod (incompetech.com) – CC BY 3.0',
  },
  {
    id: 'clair-de-lune',
    title: 'Clair de Lune (Debussy)',
    artist: 'U.S. Air Force Wright Brass',
    mood: 'lang-man',
    url: `${COMMONS}/6/63/Clair_de_Lune_-_Wright_Brass_-_United_States_Air_Force_Band_of_Flight.mp3`,
    credit: 'Public domain – U.S. Air Force Band',
  },
  {
    id: 'gymnopedie',
    title: 'Gymnopédie No.1 (Satie)',
    artist: 'Kevin MacLeod',
    mood: 'nhe-nhang',
    url: `${COMMONS}/2/2a/Gymnopedie_No._1_%28ISRC_USUAN1100787%29.mp3`,
    credit: 'Kevin MacLeod (incompetech.com) – CC BY 3.0',
  },
  {
    id: 'wedding-waltz',
    title: 'Wedding Waltz',
    artist: 'Mixkit',
    mood: 'vui-tuoi',
    url: 'https://assets.mixkit.co/music/preview/mixkit-wedding-waltz-298.mp3',
    credit: 'Mixkit Free License',
  },
];

export function findTrackByUrl(url?: string): WeddingTrack | undefined {
  if (!url) return undefined;
  return WEDDING_TRACKS.find((t) => t.url === url);
}
