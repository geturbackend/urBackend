export interface Post {
  id: string;
  title: string;
  imageUrl: string;
  category: Category;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  width: number;
  height: number;
  createdAt: string;
  tags: string[];
}

export type Category =
  | 'all'
  | 'photography'
  | 'illustration'
  | 'ai-art'
  | 'design'
  | 'architecture'
  | '3d';

export interface UploadPayload {
  title: string;
  category: Category;
  tags: string[];
  file: File;
}

export interface UploadProgress {
  stage: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  percent: number;
  message: string;
}