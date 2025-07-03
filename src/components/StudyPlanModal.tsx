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
import { GraduationCap, Copy, Check, X, RefreshCw, Download } from 'lucide-react';

interface StudyPlanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noteTitle: string;
  studyPlan: string;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

const StudyPlanModal: React.FC<StudyPlanModalProps> = ({ 
  isOpen, 
  onOpenChange, 
  noteTitle, 
  studyPlan, 
  isLoading = false,
  onRegenerate
}) => {
  const [copied, setCopied] = React.useState(false);

  // Function to remove asterisks from text
  const cleanStudyPlanText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(studyPlan);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const cleanedStudyPlan = cleanStudyPlanText(studyPlan);
    const content = `3-Day Study Plan: ${noteTitle}\n\n${cleanedStudyPlan}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${noteTitle}_study_plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-w-[90vw] w-full max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            3-Day Study Plan
          </DialogTitle>
          <DialogDescription>
            AI-generated study plan for "{noteTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-muted-foreground">Generating study plan...</span>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(80vh-180px)] pr-4">
              <div className="space-y-4 pb-4">
                <div className="p-4 bg-muted rounded-xl">
                  <h3 className="font-medium mb-2">Study Plan:</h3>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{cleanStudyPlanText(studyPlan)}</div>
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
              disabled={isLoading || !studyPlan}
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
                  Copy Study Plan
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
                Regenerate Study Plan
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={isLoading || !studyPlan}
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

export default StudyPlanModal; 