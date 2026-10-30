'use client';

import React, { useState } from 'react';
import { puppies } from '@/data/puppies';
import { siteConfig } from '@/data/siteConfig';
import { Send, CheckCircle2 } from 'lucide-react';

export const ContactForm: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [selectedPuppy, setSelectedPuppy] = useState('any puppy (not sure yet)');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const letter = `Dear TeddyPups,\nMy name is ${name}.\nPhone: ${phone}\nEmail: ${email}\nCity: ${city}\nInterested in: ${selectedPuppy}\nMessage: ${message}`;
    const waUrl = `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(letter)}`;
    window.open(waUrl, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="bg-white border border-cocoa/10 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
      {/* Decorative Stamp */}
      <div className="absolute top-6 right-6 border-2 border-dashed border-toffee/40 text-toffee px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest rotate-6 pointer-events-none hidden sm:block">
        TeddyPups Mail
      </div>

      {submitted ? (
        <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="size-16 text-[#25D366] mx-auto" />
          <h3 className="font-display text-2xl font-bold text-cocoa">
            Letter Ready to Send!
          </h3>
          <p className="text-cocoa/70 max-w-md mx-auto text-sm leading-relaxed">
            Thank you, {name}! We opened WhatsApp with your message so our puppy adoption team can reply immediately.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 px-6 py-2.5 rounded-full bg-honey/30 text-toffee-deep font-bold text-sm hover:bg-honey/50 transition-colors"
          >
            Write Another Letter
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-cocoa text-base sm:text-lg leading-loose font-medium">
            Dear TeddyPups, my name is{' '}
            <input
              type="text"
              required
              placeholder="your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="inline-block border-b-2 border-toffee/40 bg-honey/10 px-3 py-1 font-bold text-toffee-deep placeholder:text-cocoa/40 focus:outline-none focus:border-toffee rounded-lg"
            />
            , and you can reach me on{' '}
            <input
              type="tel"
              required
              placeholder="phone / whatsapp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="inline-block border-b-2 border-toffee/40 bg-honey/10 px-3 py-1 font-bold text-toffee-deep placeholder:text-cocoa/40 focus:outline-none focus:border-toffee rounded-lg"
            />{' '}
            or by email at{' '}
            <input
              type="email"
              required
              placeholder="your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="inline-block border-b-2 border-toffee/40 bg-honey/10 px-3 py-1 font-bold text-toffee-deep placeholder:text-cocoa/40 focus:outline-none focus:border-toffee rounded-lg"
            />
            . I live in{' '}
            <input
              type="text"
              required
              placeholder="Dubai / Abu Dhabi / City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="inline-block border-b-2 border-toffee/40 bg-honey/10 px-3 py-1 font-bold text-toffee-deep placeholder:text-cocoa/40 focus:outline-none focus:border-toffee rounded-lg"
            />
            , and I&#39;m curious about{' '}
            <select
              value={selectedPuppy}
              onChange={(e) => setSelectedPuppy(e.target.value)}
              className="inline-block border-b-2 border-toffee/40 bg-honey/10 px-3 py-1.5 font-bold text-toffee-deep focus:outline-none focus:border-toffee rounded-lg cursor-pointer"
            >
              <option value="any puppy (not sure yet)">any puppy (not sure yet)</option>
              {puppies.map((p) => (
                <option key={p.id} value={`${p.displayName || p.name} (${p.breed})`}>
                  {p.displayName || p.name} ({p.breed}, {p.genderLabel})
                </option>
              ))}
            </select>
            .
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-cocoa/60 mb-2">
              Your Message or Specific Questions (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Ask anything about showroom visits, puppy temperament, care requirements, or delivery timeline..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-2xl border border-cocoa/15 bg-milk/50 p-4 text-sm text-cocoa focus:outline-none focus:border-toffee focus:ring-2 focus:ring-honey/30 transition-all"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-cocoa/10">
            <span className="font-scrawl text-sm text-toffee">
              with love, a future puppy parent
            </span>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-toffee text-milk px-8 py-3.5 rounded-full font-bold text-sm shadow-md hover:bg-toffee-deep hover:shadow-lg transition-all"
            >
              <Send className="size-4" />
              <span>Post My Letter (via WhatsApp)</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

