import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Check } from 'lucide-react';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  selectedTags,
  onTagToggle,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="space-y-2">
      {/* Filter Button */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start h-8"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Plus className="h-3 w-3 mr-2" />
          Filter by tags
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {selectedTags.length}
            </Badge>
          )}
        </Button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-50 max-h-48 overflow-y-auto">
            <div className="p-2">
              <div className="text-sm font-medium mb-2 px-2">Select tags to filter</div>
              
              {availableTags.length === 0 ? (
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  No tags available
                </div>
              ) : (
                <div className="space-y-1">
                  {availableTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between px-2 py-1 text-sm hover:bg-accent rounded cursor-pointer"
                      onClick={() => onTagToggle(tag)}
                    >
                      <span>{tag}</span>
                      {selectedTags.includes(tag) && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {selectedTags.length > 0 && (
                <>
                  <hr className="my-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onClearAll();
                      setIsOpen(false);
                    }}
                    className="w-full h-7 text-xs"
                  >
                    Clear all filters
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="text-xs cursor-pointer hover:bg-primary/80"
              onClick={() => onTagToggle(tag)}
            >
              {tag}
              <X className="h-2 w-2 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TagFilter; 