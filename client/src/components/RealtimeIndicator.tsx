import { useSocket } from "@/hooks/useSocket";

export default function RealtimeIndicator() {
  const { isConnected } = useSocket();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
        isConnected 
          ? "bg-green-600 text-white" 
          : "bg-red-600 text-white"
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-green-300" : "bg-red-300"
        }`} />
        <span>{isConnected ? "Live" : "Offline"}</span>
      </div>
    </div>
  );
}