import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Gone Home — Priyanshu's submission",
  description: 'Puppies who have found their forever homes across Dubai and the Emirates.',
};

export default function GoneHomePage() {
  const htmlPath = path.join(process.cwd(), 'src/data/gone_home.html');
  const content = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';

  return (
    <div
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
