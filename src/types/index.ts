export interface PuppyMedia {
  id: string;
  url: string;
  kind: 'image' | 'video';
  width: number;
  height: number;
  alt: string;
  caption?: string;
  color?: string;
  focalX?: number;
  focalY?: number;
  blurDataUrl?: string | null;
  durationS?: number | null;
  poster?: any;
  [key: string]: any;
}

export interface Puppy {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  breed: string;
  gender: string;
  genderLabel: string;
  age: string;
  colour: string;
  description: string;
  status: string;
  featured: boolean;
  cover: PuppyMedia;
  media: PuppyMedia[];
  origin: {
    slug: string;
    name: string;
  };
  breeds: {
    slug: string;
    name: string;
  }[];
  published: boolean;
  [key: string]: any;
}

export interface GoneHomePuppy {
  slug: string;
  name: string;
  breed: string;
  gender: string;
  imageUrl: string;
  alt: string;
  status: string;
  [key: string]: any;
}

export interface HappyFamily {
  id: string;
  url: string;
  kind: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  color?: string;
  focalX?: number;
  focalY?: number;
  blurDataUrl?: string | null;
  durationS?: number | null;
  poster?: any;
  [key: string]: any;
}

export interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}
