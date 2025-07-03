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

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((tag, index) => (
        <Badge key={index} variant={variant} className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export default TagsDisplay; 