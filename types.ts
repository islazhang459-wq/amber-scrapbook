export interface Tag {
  id: number;
  imageId: number;
  keyword: string;
}

export interface ScrapbookImage {
  id: number;
  weekId: string;
  date: string;
  url: string;
  decorationType: string;
  rotation: number;
  tags: Tag[];
}

export interface WeekData {
  notes: string;
  notesHeight: number;
  images: ScrapbookImage[];
}
