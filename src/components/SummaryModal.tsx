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
import { FileText, Copy, Check, X, RefreshCw, Download } from 'lucide-react';

interface SummaryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noteTitle: string;
  summary: string;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ 
  isOpen, 
  onOpenChange, 
  noteTitle, 
  summary, 
  isLoading = false,
  onRegenerate
}) => {
  const [copied, setCopied] = React.useState(false);

  // Function to remove asterisks from text
  const cleanSummaryText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const cleanedSummary = cleanSummaryText(summary);
    const content = `Note Summary: ${noteTitle}\n\n${cleanedSummary}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteTitle}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[90vw] w-full max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Note Summary
          </DialogTitle>
          <DialogDescription>
            AI-generated summary for "{noteTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-muted-foreground">Generating summary...</span>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(80vh-180px)] pr-4">
              <div className="space-y-4 pb-4">
                <div className="p-4 bg-muted rounded-xl">
                  <h3 className="font-medium mb-2">Summary:</h3>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{cleanSummaryText(summary)}</div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
          <div className="flex items-center gap-2">
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
            
            {onRegenerate && (
              <Button
                variant="outline"
                onClick={onRegenerate}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate Summary
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isLoading || !summary}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
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