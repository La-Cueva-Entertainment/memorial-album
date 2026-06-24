export interface Comment {
  id: string;
  itemId: string;
  text: string;
  author: string;
  ts: string;
}

export interface Item {
  id: string;
  imgPath: string;
  caption: string;
  author: string;
  ts: string;
  source: 'board' | 'gallery';
  angle: number | null;
  sortOrder: number;
  status: 'pending' | 'approved';
  immichAssetId: string | null;
  comments: Comment[];
}

export interface GuestbookNote {
  id: string;
  text: string;
  author: string;
  ts: string;
}

export interface Invitation {
  id: string;
  token: string;
  note: string;
  role: 'admin' | 'contributor';
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'contributor' | 'super_contributor';
  inviteId: string | null;
  createdAt: string;
}

export interface QuoteReply {
  id: string;
  quoteId: string;
  text: string;
  author: string;
  immichAssetId: string | null;
  ts: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  context: string;
  immichAssetId: string | null;
  immichAssetType: string;
  ts: string;
  replies: QuoteReply[];
}

export interface FavoriteThing {
  id: string;
  name: string;
  emoji: string;
  category: string;
  ts: string;
}

export interface OceanSprayPost {
  id: string;
  title: string;
  body: string;
  imgPath: string | null;
  pinned: boolean;
  ts: string;
}

export interface Album {
  id: string;
  name: string;
  immichAlbumId: string | null;
  shareLink: string | null;
  coverImmichAssetId: string | null;
  createdAt: string;
}
