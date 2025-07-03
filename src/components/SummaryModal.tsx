import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Copy, Check, X } from 'lucide-react';

interface SummaryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noteTitle: string;
  summary: string;
  isLoading?: boolean;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ 
  isOpen, 
  onOpenChange, 
  noteTitle, 
  summary, 
  isLoading = false 
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] w-full max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Note Summary
          </DialogTitle>
          <DialogDescription>
            AI-generated summary for "{noteTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-muted-foreground">Generating summary...</span>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Summary:</h3>
                  <div className="text-sm whitespace-pre-wrap">{summary}</div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={isLoading || !summary}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Summary
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal; 