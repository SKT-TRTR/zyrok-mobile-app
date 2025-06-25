import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProModal({ isOpen, onClose }: ProModalProps) {
  const handleUpgrade = () => {
    // For now, just show a placeholder
    alert('Pro upgrade feature coming soon!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-800 rounded-2xl max-w-sm w-full">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-robot text-white text-2xl"></i>
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">Upgrade to Zyder Pro</h2>
            <p className="text-gray-400 text-sm">Unlock AI-powered editing tools and premium features</p>
          </div>
          
          {/* Features List */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center">
              <i className="fas fa-check text-green-500 mr-3"></i>
              <span className="text-white text-sm">AI Video Enhancement</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-check text-green-500 mr-3"></i>
              <span className="text-white text-sm">Smart Content Generation</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-check text-green-500 mr-3"></i>
              <span className="text-white text-sm">Advanced AI Filters & Effects</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-check text-green-500 mr-3"></i>
              <span className="text-white text-sm">Content Aggregation Tools</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-check text-green-500 mr-3"></i>
              <span className="text-white text-sm">Multi-Platform Import</span>
            </div>
            <div className="flex items-center">
              <i className="fas fa-check text-green-500 mr-3"></i>
              <span className="text-white text-sm">Priority Support</span>
            </div>
          </div>
          
          {/* Pricing */}
          <div className="bg-black rounded-xl p-4 mb-6">
            <div className="text-center">
              <span className="text-gray-500 text-sm line-through">$19.99/month</span>
              <div className="text-white text-2xl font-bold">
                $9.99<span className="text-sm text-gray-400">/month</span>
              </div>
              <span className="text-green-500 text-xs">50% OFF Limited Time</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-medium"
              onClick={handleUpgrade}
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline"
              className="w-full border-gray-600 text-white hover:bg-gray-800 py-3 rounded-xl font-medium"
              onClick={onClose}
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
