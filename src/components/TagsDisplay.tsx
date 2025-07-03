import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TagsDisplayProps {
  tags: string[];
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const TagsDisplay: React.FC<TagsDisplayProps> = ({ 
  tags, 
  className = '', 
  variant = 'secondary' 
}) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  // Split tags into two rows for better layout
  const midPoint = Math.ceil(tags.length / 2);
  const firstRow = tags.slice(0, midPoint);
  const secondRow = tags.slice(midPoint);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* First row */}
      <div className="flex flex-wrap gap-1">
        {firstRow.map((tag, index) => (
          <Badge key={index} variant={variant} className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
      {/* Second row (only if there are tags for it) */}
      {secondRow.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {secondRow.map((tag, index) => (
            <Badge key={index + midPoint} variant={variant} className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagsDisplay; 