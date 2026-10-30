import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "How It Works — Priyanshu's submission",
  description: 'Our white-glove process from matching to doorstep delivery in Dubai.',
};

export default function HowItWorksPage() {
  const htmlPath = path.join(process.cwd(), 'src/data/how_it_works.html');
  const content = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';

  return (
    <div
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
