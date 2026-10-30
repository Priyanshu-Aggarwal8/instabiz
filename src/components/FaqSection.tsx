'use client';

import React, { useState } from 'react';
import { faqs } from '@/data/faq';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={`border rounded-2xl transition-all overflow-hidden ${
              isOpen
                ? 'border-toffee/40 bg-white shadow-md'
                : 'border-cocoa/10 bg-white/70 hover:bg-white hover:border-cocoa/20'
            }`}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full py-4.5 px-5 sm:px-6 flex items-center justify-between gap-4 text-left font-display text-base sm:text-lg font-bold text-cocoa"
            >
              <span className="flex items-center gap-3">
                <HelpCircle className={`size-5 shrink-0 ${isOpen ? 'text-toffee' : 'text-cocoa/40'}`} />
                <span>{faq.question}</span>
              </span>
              <ChevronDown
                className={`size-5 text-cocoa/60 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-toffee' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 sm:px-6 pb-5 pt-1 text-sm sm:text-base text-cocoa/80 leading-relaxed border-t border-cocoa/5 animate-in fade-in duration-200">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

