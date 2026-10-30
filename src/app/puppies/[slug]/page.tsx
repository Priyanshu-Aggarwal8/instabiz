import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { puppies } from '@/data/puppies';
import { goneHomePuppies } from '@/data/goneHome';
import { PuppyStorybookGallery } from '@/components/PuppyStorybookGallery';

interface PuppyPageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  const allSlugs = [
    ...puppies.map((p) => ({ slug: p.slug })),
    ...goneHomePuppies.map((p) => ({ slug: p.slug })),
  ];
  return allSlugs;
}

export async function generateMetadata({ params }: PuppyPageProps): Promise<Metadata> {
  const all = [...puppies, ...goneHomePuppies];
  const pup = all.find((p) => p.slug === params.slug);
  if (!pup) return { title: "Puppy — Priyanshu's submission" };

  return {
    title: `${pup.name} — ${pup.breed} (${pup.gender === 'male' ? 'Boy' : 'Girl'}) — Priyanshu's submission`,
    description: pup.story || `${pup.name} the ${pup.breed} puppy in Dubai.`,
  };
}

export default function PuppyPage({ params }: PuppyPageProps) {
  const htmlFile = path.join(process.cwd(), 'src/data/puppies_html', `${params.slug}.html`);

  if (fs.existsSync(htmlFile)) {
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    return (
      <>
        <PuppyStorybookGallery slug={params.slug} />
        <div
          style={{ display: 'contents' }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </>
    );
  }

  // Fallback for max if in puppy_max.html
  if (params.slug === 'maltipoo-max-male') {
    const maxFile = path.join(process.cwd(), 'src/data/puppy_max.html');
    if (fs.existsSync(maxFile)) {
      const htmlContent = fs.readFileSync(maxFile, 'utf8');
      return (
        <>
          <PuppyStorybookGallery slug={params.slug} />
          <div
            style={{ display: 'contents' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </>
      );
    }
  }

  const all = [...puppies, ...goneHomePuppies];
  const pup = all.find((p) => p.slug === params.slug);
  if (!pup) notFound();

  return (
    <>
      <PuppyStorybookGallery slug={params.slug} />
      <div className="py-24 text-center">
        <h1 className="font-plush text-4xl">{pup.name}</h1>
        <p className="mt-2 text-lg text-cocoa/70">{pup.breed}</p>
      </div>
    </>
  );
}
