import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Save, X } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onOpenChange }) => {
  const [apiKey, setApiKey] = React.useState('');
  const [currentApiKey, setCurrentApiKey] = React.useState('');

  React.useEffect(() => {
    // Load existing API key on component mount
    const stored = localStorage.getItem('openai_api_key');
    if (stored) {
      setCurrentApiKey(stored);
      setApiKey(stored);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      setCurrentApiKey(apiKey.trim());
      onOpenChange(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setCurrentApiKey('');
  };

  const maskedApiKey = currentApiKey ? 
    `${currentApiKey.substring(0, 8)}${'*'.repeat(Math.max(0, currentApiKey.length - 12))}${currentApiKey.slice(-4)}` : 
    '';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Key
          </DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to enable AI-powered features. Your key is stored locally and never shared.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 min-w-0">
          {currentApiKey && (
            <div className="p-3 bg-muted rounded-lg min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Current API Key:</p>
              <p className="font-mono text-sm break-all">{maskedApiKey}</p>
            </div>
          )}
          
          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium">API Key:</label>
            <div className="min-w-0">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono w-full min-w-0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>
        </div>

        <div className="flex justify-between gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!currentApiKey}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
          
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!apiKey.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyModal; 