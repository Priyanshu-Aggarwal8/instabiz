import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Us — Priyanshu's submission",
  description: 'Reach our puppy concierge via WhatsApp, phone, or visit our showroom.',
};

export default function ContactPage() {
  const htmlPath = path.join(process.cwd(), 'src/data/contact.html');
  const content = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '';

  return (
    <div
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
