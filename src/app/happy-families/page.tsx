import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Happy Families — Priyanshu's submission",
  description: "Real photos, reviews, and stories from families who welcomed a Priyanshu's submission puppy.",
};

export default function HappyFamiliesPage() {
  const htmlPath = path.join(process.cwd(), 'src/data/happy_families.html');
  const content = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';

  return (
    <div
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
