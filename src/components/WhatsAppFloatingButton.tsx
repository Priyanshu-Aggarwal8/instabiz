import React from 'react';
import { siteConfig } from '@/data/siteConfig';
import { MessageCircle } from 'lucide-react';

export const WhatsAppFloatingButton: React.FC = () => {
  return (
    <a
      href={siteConfig.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:bg-[#20ba59] hover:scale-105 active:scale-95 transition-all group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="size-6 fill-white" />
      <span className="hidden sm:inline font-bold text-sm tracking-wide">
        Chat with us
      </span>
      <span className="absolute -top-1 -right-1 flex size-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex size-3 rounded-full bg-honey"></span>
      </span>
    </a>
  );
};

