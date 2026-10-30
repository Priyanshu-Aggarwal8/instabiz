import React from 'react';

interface FooterProps {
  initialHtml?: string;
}

export const Footer: React.FC<FooterProps> = ({ initialHtml }) => {
  return (
    <div
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: initialHtml || '' }}
    />
  );
};
