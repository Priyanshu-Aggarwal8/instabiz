import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GoneHomePuppy } from '@/types';

interface TicketCardProps {
  ticket: GoneHomePuppy;
  index?: number;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, index = 0 }) => {
  const tiltDeg = ((index % 5) - 2) * 0.8;

  return (
    <div
      className="tp-ticket group relative bg-white border border-cocoa/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
      style={{ transform: `rotate(${tiltDeg}deg)` }}
    >
      <Link href={`/puppies/${ticket.slug}`} className="block p-3 sm:p-4">
        <div className="flex items-center gap-3.5">
          {/* Circular/Rounded Photo */}
          <div className="relative size-20 sm:size-24 rounded-xl overflow-hidden shrink-0 bg-cocoa/5 border border-cocoa/10">
            <Image
              src={ticket.imageUrl}
              alt={ticket.alt || `${ticket.name}, ${ticket.breed}`}
              fill
              sizes="96px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Ticket Information */}
          <div className="flex-1 min-w-0">
            <span className="font-scrawl text-xs text-toffee font-semibold block">
              one ticket home
            </span>
            <h4 className="font-display text-lg sm:text-xl font-bold text-cocoa truncate leading-tight group-hover:text-toffee transition-colors">
              {ticket.name}
            </h4>
            <p className="text-xs text-cocoa/70 font-medium capitalize mt-0.5">
              {ticket.breed}{ticket.gender ? `, ${ticket.gender}` : ''}
            </p>

            {/* Flight Path / Route */}
            <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-toffee-deep">
              <span className="bg-honey/30 px-2 py-0.5 rounded-md">TeddyPups</span>
              <span className="text-cocoa/40">&rarr;</span>
              <span className="bg-blush/40 text-toffee-ink px-2 py-0.5 rounded-md">Home ♥</span>
            </div>
          </div>
        </div>

        {/* Perforated Divider & Stub */}
        <div className="mt-3.5 pt-2.5 border-t border-dashed border-cocoa/15 flex items-center justify-between text-[11px] text-cocoa/50 font-bold uppercase tracking-widest">
          <span>ALUMNI NO. {index + 101}</span>
          <span className="text-toffee">ADMIT ONE</span>
        </div>
      </Link>
    </div>
  );
};

