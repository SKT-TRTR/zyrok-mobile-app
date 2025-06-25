import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useState } from "react";

export default function InstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  // Show prompt after user has interacted with the app
  useState(() => {
    if (isInstallable) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  if (!isInstallable || !showPrompt) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md bg-black border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-500" />
            Install ZyRok App
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Get the full ZyRok experience! Install our app for faster loading, offline access, and push notifications.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={installApp}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setShowPrompt(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4 mr-2" />
            Maybe Later
          </Button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          • Works offline
          • Faster performance
          • Push notifications
          • Full screen experience
        </div>
      </DialogContent>
    </Dialog>
  );
}