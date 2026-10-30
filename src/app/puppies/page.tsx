import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Puppies — Priyanshu's submission",
  description: 'Available teacup and teddy bear puppies in Dubai and Abu Dhabi.',
};

export default function PuppiesPage() {
  const htmlPath = path.join(process.cwd(), 'src/data/puppies.html');
  const content = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';

  return (
    <div
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
