import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import Discover from "@/pages/discover";
import SimpleCameraPage from "@/pages/simple-camera";
import Inbox from "@/pages/inbox";
import InstallPrompt from "@/components/InstallPrompt";
import RealtimeIndicator from "@/components/RealtimeIndicator";
import NotificationToast from "@/components/NotificationToast";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/profile/:id?" component={Profile} />
          <Route path="/discover" component={Discover} />
          <Route path="/camera" component={SimpleCameraPage} />
          <Route path="/inbox" component={Inbox} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-black text-white min-h-screen">
        <Router />
        <RealtimeIndicator />
        <NotificationToast />
        <InstallPrompt />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
