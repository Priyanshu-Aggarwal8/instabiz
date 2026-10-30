'use client';

import React, { useState, useMemo } from 'react';
import { Puppy } from '@/types';
import { PuppyCard } from '@/components/PuppyCard';
import { Search, Filter, Sparkles } from 'lucide-react';

interface PuppyCatalogProps {
  initialPuppies: Puppy[];
}

export const PuppyCatalog: React.FC<PuppyCatalogProps> = ({ initialPuppies }) => {
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [selectedBreed, setSelectedBreed] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique breeds
  const breeds = useMemo(() => {
    const set = new Set<string>();
    initialPuppies.forEach((p) => {
      if (p.breed) set.add(p.breed);
      p.breeds?.forEach((b) => set.add(b.name));
    });
    return Array.from(set).sort();
  }, [initialPuppies]);

  // Filtered puppies
  const filteredPuppies = useMemo(() => {
    return initialPuppies.filter((puppy) => {
      // Origin filter
      if (selectedOrigin !== 'all' && puppy.origin.slug !== selectedOrigin) {
        return false;
      }
      // Breed filter
      if (selectedBreed !== 'all') {
        const matchesMain = puppy.breed.toLowerCase().includes(selectedBreed.toLowerCase());
        const matchesSub = puppy.breeds?.some((b) =>
          b.name.toLowerCase().includes(selectedBreed.toLowerCase())
        );
        if (!matchesMain && !matchesSub) return false;
      }
      // Gender filter
      if (selectedGender !== 'all' && puppy.gender !== selectedGender) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (puppy.name || puppy.displayName).toLowerCase().includes(q);
        const matchesBreed = puppy.breed.toLowerCase().includes(q);
        if (!matchesName && !matchesBreed) return false;
      }
      return true;
    });
  }, [initialPuppies, selectedOrigin, selectedBreed, selectedGender, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Controls & Filter Bar */}
      <div className="bg-white border border-cocoa/10 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        {/* Origin Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cocoa/5 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Puppies' },
              { id: 'local', label: 'Local (In Dubai Showroom)' },
              { id: 'imported', label: 'Imported (Order Upon Request)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedOrigin(tab.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                  selectedOrigin === tab.id
                    ? 'bg-toffee text-milk shadow-md'
                    : 'bg-cocoa/5 text-cocoa/70 hover:bg-honey/20 hover:text-cocoa'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-cocoa/50">
            Showing <strong className="text-toffee">{filteredPuppies.length}</strong> of {initialPuppies.length}
          </span>
        </div>

        {/* Secondary Filters: Breed, Gender, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-cocoa/40" />
            <input
              type="text"
              placeholder="Search by name or breed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-cocoa/15 bg-milk/50 text-xs sm:text-sm text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:border-toffee"
            />
          </div>

          {/* Breed Dropdown */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-cocoa/40" />
            <select
              value={selectedBreed}
              onChange={(e) => setSelectedBreed(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-2xl border border-cocoa/15 bg-milk/50 text-xs sm:text-sm text-cocoa focus:outline-none focus:border-toffee cursor-pointer"
            >
              <option value="all">All Breeds</option>
              {breeds.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Genders' },
              { id: 'male', label: 'Boy ♂' },
              { id: 'female', label: 'Girl ♀' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGender(g.id)}
                className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                  selectedGender === g.id
                    ? 'border-toffee bg-honey/20 text-toffee-deep'
                    : 'border-cocoa/10 bg-milk/50 text-cocoa/70 hover:bg-cocoa/5'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Puppies */}
      {filteredPuppies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPuppies.map((puppy) => (
            <PuppyCard key={puppy.id} puppy={puppy} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white border border-cocoa/10 rounded-3xl p-8 max-w-lg mx-auto space-y-3">
          <Sparkles className="size-12 text-honey mx-auto" />
          <h3 className="font-display text-xl font-bold text-cocoa">
            No puppies found matching this criteria
          </h3>
          <p className="text-sm text-cocoa/70">
            Try adjusting your filters or ask our team on WhatsApp — we have upcoming litters arriving weekly!
          </p>
          <button
            onClick={() => {
              setSelectedOrigin('all');
              setSelectedBreed('all');
              setSelectedGender('all');
              setSearchQuery('');
            }}
            className="mt-2 px-5 py-2 rounded-full bg-toffee text-milk text-xs font-bold hover:bg-toffee-deep transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

