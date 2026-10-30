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
  const htmlDir = path.join(process.cwd(), 'src/data/puppies_html');
  const fileSlugs = fs.existsSync(htmlDir)
    ? fs.readdirSync(htmlDir).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''))
    : [];

  const slugSet = new Set([
    ...puppies.map((p) => p.slug),
    ...goneHomePuppies.map((p) => p.slug),
    ...fileSlugs,
  ]);

  return Array.from(slugSet).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PuppyPageProps): Promise<Metadata> {
  const all: any[] = [...puppies, ...goneHomePuppies];
  const pup = all.find((p) => p.slug === params.slug);
  const name = pup?.name || pup?.displayName || 'Puppy';
  const breed = pup?.breed || 'Puppy';

  return {
    title: `${name} — ${breed} — Priyanshu's submission`,
    description: pup?.story || `${name} the ${breed} puppy in Dubai.`,
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

  const all: any[] = [...puppies, ...goneHomePuppies];
  const pup = all.find((p) => p.slug === params.slug);
  if (!pup) notFound();

  // Full rich storybook layout fallback so an incomplete page NEVER opens
  return (
    <>
      <PuppyStorybookGallery slug={params.slug} />
      <main id="main" tabIndex={-1} className="relative pt-[var(--header-h)] outline-none">
        <div data-page="pup" className="tp-page">
          <article
            className="tp-storybook"
            style={{
              background:
                'linear-gradient(180deg, color-mix(in oklab, #f8e8e8 24%, var(--color-milk)) 0, var(--color-milk) 85%)',
            }}
          >
            <div className="gutter mx-auto max-w-[110rem] pb-20 pt-8 md:pt-12">
              <nav aria-label="Breadcrumb" className="text-[0.95rem] font-semibold text-cocoa-soft">
                <a className="link-ink" href="/puppies">
                  Available puppies
                </a>
                <span aria-hidden="true"> / </span>
                <span aria-current="page">{pup.name || 'Puppy'}</span>
              </nav>
              <div className="mt-4 grid gap-10 lg:grid-cols-12 lg:gap-14">
                <div className="min-w-0 lg:col-span-7">
                  <div className="tp-storypage relative aspect-[4/5] overflow-hidden rounded-[2rem] border-[3px] border-cocoa md:aspect-[5/6]">
                    {pup.imageUrl && (
                      <img
                        alt={pup.name || 'Puppy'}
                        src={pup.imageUrl}
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="min-w-0 lg:col-span-5">
                  <div className="tp-tag tp-board mt-16 !rounded-[2.2rem_2.2rem_2.2rem_0.6rem] !p-7 md:!p-9 lg:mt-20">
                    <span className="chip">
                      {pup.status === 'adopted' ? 'Gone Home' : 'Available'}
                    </span>
                    <h1 className="font-plush mt-4 text-[clamp(2.6rem,5vw,4.6rem)]">
                      {pup.name || 'Puppy'}
                    </h1>
                    <p className="mt-2 text-lg font-semibold text-cocoa-soft">{pup.breed}</p>
                    <div className="mt-8 flex flex-col gap-3">
                      <a
                        href="https://wa.me/971541676733"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-whatsapp"
                      >
                        Ask about {pup.name || 'this puppy'} on WhatsApp
                      </a>
                      <a href="/puppies" className="btn btn-ghost">
                        View all puppies
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>
    </>
  );
}
