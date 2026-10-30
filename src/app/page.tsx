import fs from 'fs';
import path from 'path';

export default function HomePage() {
  const htmlPath = path.join(process.cwd(), 'src/data/main_landing.html');
  const mainHtml = fs.readFileSync(htmlPath, 'utf8');

  return (
    <div
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: mainHtml }}
    />
  );
}
