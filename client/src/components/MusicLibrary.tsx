import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Play, Pause, TrendingUp, X, Music, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MusicLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMusic: (music: any) => void;
  selectedMusic?: any;
}

export default function MusicLibrary({ isOpen, onClose, onSelectMusic, selectedMusic }: MusicLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const { data: musicTracks, isLoading } = useQuery({
    queryKey: ["/api/music", selectedCategory, searchQuery],
    enabled: isOpen,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/music/categories"],
    enabled: isOpen,
  });

  const { data: trendingMusic } = useQuery({
    queryKey: ["/api/music/trending"],
    enabled: isOpen,
  });

  const handlePlayPreview = (trackId: string) => {
    if (playingTrack === trackId) {
      setPlayingTrack(null);
    } else {
      setPlayingTrack(trackId);
      // In a real app, you would play the audio preview here
      setTimeout(() => setPlayingTrack(null), 3000); // Stop after 3 seconds
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
      <div className="bg-gray-900 w-full max-w-md h-4/5 rounded-t-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Add Music</h2>
          <Button 
            onClick={onClose}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="h-full">
            {/* Category Tabs */}
            <div className="px-4">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className="whitespace-nowrap"
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === "trending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("trending")}
                  className="whitespace-nowrap"
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Trending
                </Button>
                {categories?.slice(2, 8).map((category: any) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Music List */}
            <div className="px-4 pb-4 overflow-y-auto h-96">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-700 rounded"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-700 rounded mb-2"></div>
                              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedCategory === "trending" ? trendingMusic : musicTracks)?.map((track: any) => (
                    <Card 
                      key={track.id} 
                      className={`bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                        selectedMusic?.id === track.id ? 'ring-2 ring-purple-400' : ''
                      }`}
                      onClick={() => onSelectMusic(track)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          {/* Play Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPreview(track.id);
                            }}
                            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                          >
                            {playingTrack === track.id ? (
                              <Pause className="w-5 h-5 text-white" />
                            ) : (
                              <Play className="w-5 h-5 text-white" />
                            )}
                          </Button>

                          {/* Track Info */}
                          <div className="flex-1">
                            <h3 className="font-medium text-white truncate">{track.title}</h3>
                            <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                              </span>
                              {track.usageCount && (
                                <span className="text-xs text-gray-500">
                                  • {track.usageCount.toLocaleString()} uses
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Audio Visualizer */}
                          {playingTrack === track.id && (
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="w-1 bg-purple-400 rounded animate-pulse"
                                  style={{
                                    height: `${Math.random() * 20 + 10}px`,
                                    animationDelay: `${i * 100}ms`
                                  }}
                                />
                              ))}
                            </div>
                          )}

                          {/* Selection Indicator */}
                          {selectedMusic?.id === track.id && (
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <Music className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isLoading && (!musicTracks || musicTracks.length === 0) && (
                <div className="text-center py-8">
                  <Volume2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No music found</p>
                  <p className="text-sm text-gray-500">Try a different search term</p>
                </div>
              )}
            </div>
          </Tabs>
        </div>

        {/* Selected Music Footer */}
        {selectedMusic && (
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{selectedMusic.title}</p>
                <p className="text-sm text-gray-400">{selectedMusic.artist}</p>
              </div>
              <Button 
                onClick={onClose}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Use Sound
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}