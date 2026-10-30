import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Puppy } from '@/types';
import { MessageCircle, Heart } from 'lucide-react';

interface PuppyCardProps {
  puppy: Puppy;
}

export const PuppyCard: React.FC<PuppyCardProps> = ({ puppy }) => {
  const whatsappEnquiryUrl = `https://wa.me/971541676733?text=${encodeURIComponent(
    `Hi TeddyPups! I'm interested in ${puppy.name || puppy.displayName} (${puppy.breed}, ${puppy.genderLabel}). Is this puppy still available?`
  )}`;

  return (
    <div className="tp-sketch group bg-white border border-cocoa/10 rounded-3xl p-3 sm:p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Puppy Image Container */}
        <Link href={`/puppies/${puppy.slug}`} className="block relative aspect-[4/5] overflow-hidden rounded-2xl bg-cocoa/5 mb-3.5">
          <Image
            src={puppy.cover.url}
            alt={puppy.cover.alt || `${puppy.name || puppy.displayName}, ${puppy.breed}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Badges on Top */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <span
              className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                puppy.origin.slug === 'local'
                  ? 'bg-amber-100/90 text-amber-900 border border-amber-300'
                  : 'bg-sky/90 text-sky-deep border border-sky-300'
              }`}
            >
              {puppy.origin.name}
            </span>

            <span className="bg-white/90 text-toffee text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-cocoa/5">
              <Heart className="size-3 fill-toffee" />
              <span>Available</span>
            </span>
          </div>

          {/* Bottom Overlay with Gender & Age */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 pointer-events-none">
            <span className="bg-cocoa/80 backdrop-blur-md text-milk text-xs font-semibold px-2.5 py-1 rounded-full">
              {puppy.genderLabel}
            </span>
            {puppy.age && (
              <span className="bg-white/85 backdrop-blur-md text-cocoa text-xs font-semibold px-2.5 py-1 rounded-full">
                {puppy.age}
              </span>
            )}
          </div>
        </Link>

        {/* Title & Breed */}
        <div className="px-1 mb-3">
          <Link href={`/puppies/${puppy.slug}`} className="block group-hover:text-toffee transition-colors">
            <h3 className="font-display text-xl font-bold text-cocoa tracking-tight leading-snug">
              {puppy.displayName || puppy.name}
            </h3>
          </Link>
          <p className="text-sm font-medium text-cocoa/60 mt-0.5">
            {puppy.breed}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-cocoa/5 flex items-center gap-2">
        <Link
          href={`/puppies/${puppy.slug}`}
          className="flex-1 text-center py-2.5 px-3 rounded-xl border border-cocoa/15 text-xs font-bold text-cocoa hover:bg-honey/15 hover:border-toffee transition-all"
        >
          View Profile
        </Link>
        <a
          href={whatsappEnquiryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center p-2.5 bg-[#25D366] text-white rounded-xl shadow-sm hover:bg-[#20ba59] hover:shadow-md transition-all"
          title="Reserve on WhatsApp"
        >
          <MessageCircle className="size-4.5 fill-white" />
        </a>
      </div>
    </div>
  );
};

