import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Priyanshu's submission",
  description: 'Everything you need to know about our teacup puppies, health guarantees, and adoption in Dubai.',
};

export default function FAQPage() {
  const htmlPath = path.join(process.cwd(), 'src/data/faq.html');
  const content = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';

  return (
    <div
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
