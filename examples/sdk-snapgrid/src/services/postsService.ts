import { Post, Category } from '../types';

const UNSPLASH_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1686191128892-3b37add4c844?w=800&q=80', w: 800, h: 1067 },
  { url: 'https://images.unsplash.com/photo-1701101284946-060ab4e95a37?w=800&q=80', w: 800, h: 600 },
  { url: 'https://images.unsplash.com/photo-1718048492176-a86e6d9e0fcb?w=800&q=80', w: 800, h: 1000 },
  { url: 'https://images.unsplash.com/photo-1722432565516-cb3a4e13d5f7?w=800&q=80', w: 800, h: 600 },
  { url: 'https://images.unsplash.com/photo-1682685797661-9e0c87f59c60?w=800&q=80', w: 800, h: 1100 },
  { url: 'https://images.unsplash.com/photo-1690745628604-b35e337ef28c?w=800&q=80', w: 800, h: 650 },
  { url: 'https://images.unsplash.com/photo-1711544236172-1fcb7e44d2f3?w=800&q=80', w: 800, h: 900 },
  { url: 'https://images.unsplash.com/photo-1693726260761-e7c4fcf7b1cc?w=800&q=80', w: 800, h: 750 },
  { url: 'https://images.unsplash.com/photo-1679678691006-0ad24fecb769?w=800&q=80', w: 800, h: 1200 },
  { url: 'https://images.unsplash.com/photo-1688467276924-a772ab6c82a5?w=800&q=80', w: 800, h: 600 },
  { url: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=800&q=80', w: 800, h: 1000 },
  { url: 'https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=800&q=80', w: 800, h: 700 },
];

const AUTHORS = [
  { name: 'Aryan Mehta', avatar: 'https://i.pravatar.cc/40?img=1' },
  { name: 'Sofia Chen', avatar: 'https://i.pravatar.cc/40?img=5' },
  { name: 'Luca Ricci', avatar: 'https://i.pravatar.cc/40?img=8' },
  { name: 'Zara Khan', avatar: 'https://i.pravatar.cc/40?img=9' },
  { name: 'Kai Nakamura', avatar: 'https://i.pravatar.cc/40?img=12' },
];

const CATEGORIES: Category[] = ['photography', 'illustration', 'ai-art', 'design', 'architecture', '3d'];

const TITLES = [
  'Neon Dreams', 'Void Geometry', 'Golden Hour', 'Neural Canvas',
  'Crystal Cascade', 'Urban Mirage', 'Liquid Chrome', 'Obsidian Flow',
  'Prismatic Shift', 'Entropy Garden', 'Solaris', 'Dust & Light',
];

const TAGS = ['abstract', 'dark', 'minimal', 'surreal', 'geometric', 'organic', 'futuristic', 'ethereal'];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const mockPosts: Post[] = UNSPLASH_IMAGES.map((img, i) => ({
  id: `post-${i + 1}`,
  title: TITLES[i % TITLES.length],
  imageUrl: img.url,
  category: CATEGORIES[i % CATEGORIES.length],
  author: randomPick(AUTHORS),
  likes: Math.floor(Math.random() * 2400) + 80,
  width: img.w,
  height: img.h,
  createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
  tags: [randomPick(TAGS), randomPick(TAGS)].filter((v, idx, a) => a.indexOf(v) === idx),
}));

export const myMockPosts: Post[] = mockPosts.slice(0, 4).map(p => ({
  ...p,
  id: `my-${p.id}`,
  author: { name: 'You', avatar: 'https://i.pravatar.cc/40?img=3' },
}));

export async function fetchPosts(category?: Category, search?: string): Promise<Post[]> {
  await new Promise(r => setTimeout(r, 900));
  let posts = [...mockPosts];
  if (category && category !== 'all') {
    posts = posts.filter(p => p.category === category);
  }
  if (search && search.trim()) {
    const q = search.toLowerCase();
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q)) ||
      p.category.includes(q)
    );
  }
  return posts;
}

export async function fetchMyPosts(): Promise<Post[]> {
  await new Promise(r => setTimeout(r, 700));
  return myMockPosts;
}

export async function simulateUpload(
  _payload: unknown,
  onProgress: (p: number) => void
): Promise<void> {
  for (let i = 0; i <= 100; i += 5) {
    await new Promise(r => setTimeout(r, 80));
    onProgress(i);
  }
}