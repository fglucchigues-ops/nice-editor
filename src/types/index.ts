export interface Document {
  id?: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  stickyTitle: boolean;
}

export type View = 'write' | 'documents';

export interface TextSelection {
  range: Range;
  rect: DOMRect;
}