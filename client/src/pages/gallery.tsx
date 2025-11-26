
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "wouter";
import { Camera, Trash2, Download, Share2 } from "lucide-react";
import QRCode from 'react-qr-code';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhotoStrip } from "@/components/photo-booth/photo-strip";
import { useToast } from "@/hooks/use-toast";

interface SavedStrip {
  id: string;
  photos: string[];
  layout: "strip" | "collage";
  stripName: string;
  backgroundColor: string;
  nameColor: string;
  dateColor: string;
  showDate: boolean;
  showName: boolean;
  timestamp: number;
}

export default function Gallery() {
  const { userId } = useAuth();
  const [savedStrips, setSavedStrips] = useState<SavedStrip[]>([]);
  const { toast } = useToast();
  const photoStripRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [generatingShareId, setGeneratingShareId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("photoStrips");
    if (stored) {
      setSavedStrips(JSON.parse(stored));
    }
  }, []);

  const deleteStrip = (id: string) => {
    const updated = savedStrips.filter(strip => strip.id !== id);
    setSavedStrips(updated);
    localStorage.setItem("photoStrips", JSON.stringify(updated));
    toast({
      title: "Deleted",
      description: "Photo strip removed from gallery",
      variant: "default",
      duration: 2000,
    });
  };

  const downloadStrip = (strip: SavedStrip) => {
    // Create a temporary canvas and draw the photo strip on it
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 20;
    const placeholderWidth = 200;
    const placeholderHeight = Math.floor(placeholderWidth * 0.75);
    const hasText = strip.showName || strip.showDate;
    const textSpace = hasText ? (strip.showName && strip.showDate ? 80 : 40) : 0;

    if (strip.layout === "strip") {
      canvas.width = placeholderWidth + (padding * 2);
      const gridHeight = (placeholderHeight * 4) + (padding * 3);
      canvas.height = padding + gridHeight + (hasText ? padding + textSpace : padding);
    } else {
      canvas.width = 450;
      const gridSize = canvas.width - (padding * 2);
      const cellSize = (gridSize - padding) / 2;
      const gridHeight = (cellSize * 2) + padding;
      canvas.height = padding + gridHeight + (hasText ? padding + textSpace : padding);
    }

    // Fill background
    ctx.fillStyle = strip.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw images
    const images = strip.photos.map(src => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      return img;
    });

    let loadedCount = 0;
    images.forEach((img, index) => {
      img.onload = () => {
        loadedCount++;
        if (loadedCount === images.length) {
          // Draw images on canvas
          if (strip.layout === "strip") {
            images.forEach((image, i) => {
              const x = padding;
              const y = padding + (i * (placeholderHeight + padding));
              ctx!.drawImage(image, x, y, placeholderWidth, placeholderHeight);
            });
          } else {
            const gridSize = canvas.width - (padding * 2);
            const cellSize = (gridSize - padding) / 2;
            images.forEach((image, i) => {
              const col = i % 2;
              const row = Math.floor(i / 2);
              const x = padding + (col * (cellSize + padding));
              const y = padding + (row * (cellSize + padding));
              ctx!.drawImage(image, x, y, cellSize, cellSize);
            });
          }

          // Draw text if needed
          if (strip.showName || strip.showDate) {
            let textY = canvas.height - (hasText ? (strip.showName && strip.showDate ? 60 : 30) : padding);
            
            if (strip.showName) {
              ctx!.fillStyle = strip.nameColor;
              ctx!.font = "bold 16px Arial";
              ctx!.textAlign = "center";
              ctx!.fillText(strip.stripName || "Untitled", canvas.width / 2, textY);
              textY += 25;
            }
            
            if (strip.showDate) {
              ctx!.fillStyle = strip.dateColor;
              ctx!.font = "14px Arial";
              ctx!.textAlign = "center";
              ctx!.fillText(new Date(strip.timestamp).toLocaleDateString(), canvas.width / 2, textY);
            }
          }

          // Download the canvas
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `photobooth-${strip.stripName || "photo"}-${new Date(strip.timestamp).getTime()}.png`;
          link.click();

          toast({
            title: "Downloaded",
            description: `${strip.stripName || 'Photo'} has been downloaded`,
            variant: "default",
            duration: 2000,
          });
        }
      };
    });
  };

  const handleShareStrip = async (strip: SavedStrip) => {
    if (!userId) {
      toast({ title: 'Sign in required', description: 'Please sign in to create a shareable link.', variant: 'default' });
      return;
    }
    setGeneratingShareId(strip.id);

    try {
      // First save the strip to server
      const response = await fetch("/api/photo-strips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          photos: strip.photos,
          layout: strip.layout,
          backgroundColor: strip.backgroundColor,
          stripName: strip.stripName,
          showDate: strip.showDate,
          showName: strip.showName,
          nameColor: strip.nameColor,
          dateColor: strip.dateColor,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save photo strip');
      }

      const saved = await response.json();

      // Create shared link
      const shareResponse = await fetch('/api/shared-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoStripId: saved.id }),
      });

      if (!shareResponse.ok) {
        throw new Error('Failed to create share link');
      }

      const shareData = await shareResponse.json();
      const fullUrl = `${window.location.origin}${shareData.url}`;
      setShareUrl(fullUrl);
      setShareModalOpen(true);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Unable to create share link', variant: 'destructive' });
    }
    finally {
      setGeneratingShareId((prev) => (prev === strip.id ? null : prev));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto py-10 sm:py-14 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-0 mb-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-300 transform hover:scale-105">
              <Camera className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">My Gallery</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{savedStrips.length} saved {savedStrips.length === 1 ? 'strip' : 'strips'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/home">
              <Button className="px-6 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">New Photo Booth</Button>
            </Link>
          </div>
        </div>
        {savedStrips.length === 0 ? (
          <div className="text-center py-20 sm:py-28">
            <div className="mx-auto max-w-sm">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-900 dark:to-indigo-900 rounded-3xl mb-6 shadow-lg">
                <Camera className="h-12 w-12 text-sky-600 dark:text-sky-400" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent mb-3">No saved photo strips yet</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-8">Create your first photo strip to see it here. Saved strips appear in your gallery for quick access and downloading.</p>
              <Link href="/home">
                <Button className="px-8 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">Create Your First Photo Strip</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {savedStrips.map((strip) => {
              const isGeneratingShareForStrip = generatingShareId === strip.id;
              return (
                <div key={strip.id} className="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600" />
                  <div className="p-4 sm:p-5 flex flex-col items-center">
                    <div className="w-full max-w-xs">
                      <div className="rounded-lg overflow-hidden bg-transparent flex items-center justify-center p-2">
                        <PhotoStrip
                          photos={strip.photos || []}
                          layout={strip.layout || "strip"}
                          name={strip.stripName || ""}
                          backgroundColor={strip.backgroundColor || "#E1D9D1"}
                          nameColor={strip.nameColor || "#000000"}
                          dateColor={strip.dateColor || "#666666"}
                          showDate={strip.showDate !== false}
                          showName={strip.showName !== false}
                          hideButtons={true}
                          darkMode={false}
                        />
                      </div>
                    </div>
                    <div className="mt-4 text-center w-full">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-lg truncate">{strip.stripName || 'Untitled'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(strip.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex items-center gap-2">
                    <Button 
                      onClick={() => downloadStrip(strip)} 
                      variant="default" 
                      size="sm" 
                      className="flex-1 sm:flex-none bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 gap-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                    <Button 
                      onClick={() => handleShareStrip(strip)}
                      variant="outline"
                      size="sm"
                      className="flex-none w-28 text-sky-600 dark:text-sky-300 border-2 border-sky-100 hover:bg-sky-50 dark:hover:bg-slate-800 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isGeneratingShareForStrip}
                    >
                      <Share2 className="h-4 w-4 mr-2 inline" />
                      <span>{isGeneratingShareForStrip ? 'Generating...' : 'Share'}</span>
                    </Button>
                    <Button 
                      onClick={() => deleteStrip(strip.id)} 
                      variant="destructive" 
                      size="sm" 
                      className="flex-none w-10 h-10 p-0 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
          <DialogContent className="sm:max-w-[425px] mx-4">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Share Photo Strip</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="text-center overflow-auto max-h-80">
                {shareUrl && typeof window !== 'undefined' && <QRCode value={shareUrl} size={Math.min(256, window.innerWidth - 60)} />}
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Input id="share-url" value={shareUrl} readOnly className="flex-1 text-xs sm:text-base rounded-lg" />
                <Button onClick={() => { navigator.clipboard.writeText(shareUrl); toast({ title: 'Link copied', description: 'Share link copied to clipboard', variant: 'default' }); }} className="w-full sm:w-auto text-xs sm:text-base bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">Copy Link</Button>
              </div>
              <p className="text-xs sm:text-sm text-center text-slate-500">Scan the QR code or copy the link to share.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
