import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Image as ImageIcon, Share2, Save } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ShareModal } from "./share-modal";

interface PhotoStripProps {
  photos: string[];
  layout: "strip" | "collage";
  name?: string;
  showDate?: boolean;
  showName?: boolean;
  backgroundColor?: string;
  nameColor?: string;
  dateColor?: string;
  hideButtons?: boolean;
  darkMode?: boolean;
  showShareButton?: boolean;
  onShare?: () => void;
  onSaveToGallery?: () => void;
  isShareLoading?: boolean;
}

export const PhotoStrip: React.FC<PhotoStripProps> = ({
  photos,
  layout,
  name,
  showDate = true,
  showName = true,
  backgroundColor = "#ffffff",
  nameColor = "#000000",
  dateColor = "#666666",
  hideButtons = false,
  darkMode = false,
  showShareButton = false,
  onShare,
  onSaveToGallery,
  isShareLoading = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  const [photoStripId, setPhotoStripId] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ensure photos is an array
    if (!Array.isArray(photos)) {
      console.error("Photos prop is not an array:", photos);
      return;
    }

    // Create a new canvas for photo composition
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Set initial canvas dimensions
    const padding = 20; // Reduced padding for both layouts

    // Calculate text space needed for name and date with layout-specific spacing
    const hasText = showName || showDate;
    const textSpace = hasText ? (showName && showDate ? 80 : 40) : 0;

    // Define placeholder dimensions for strip layout
    const placeholderWidth = 200; // Reduced width for placeholder images
    const placeholderHeight = Math.floor(placeholderWidth * 0.75);

    let photoWidth: number;
    let photoHeight: number;
    let gridHeight: number;

    if (layout === "strip") {
      canvas.width = placeholderWidth + (padding * 2); // Set width to fit placeholder with padding
      gridHeight = (placeholderHeight * 4) + (padding * 3); // Height of just the photos and spacing between them
      // Set canvas height with text at bottom
      canvas.height = padding + gridHeight + (hasText ? padding + textSpace : padding);
    } else {
      // For collage layout
      canvas.width = 450; // Reduced from 600 to 450 for collage layout
      const gridSize = canvas.width - (padding * 2); // Total space for grid
      const cellSize = (gridSize - padding) / 2; // Size for each image cell, accounting for middle padding
      gridHeight = (cellSize * 2) + padding; // Height of the 2x2 grid including middle padding
      photoWidth = cellSize;
      photoHeight = cellSize;

      // Set canvas height with text at bottom
      canvas.height = padding + gridHeight + (hasText ? padding + textSpace : padding);
    }

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Clear canvas and apply background
    tempCtx.fillStyle = backgroundColor;
    tempCtx.fillRect(0, 0, canvas.width, canvas.height);

    if (layout === "strip") {
      photoWidth = placeholderWidth;
      photoHeight = placeholderHeight;
      gridHeight = (photoHeight * 4) + (padding * 3);
    } else {
      // For collage, calculate cell size from total width minus outer and middle padding
      const availableWidth = canvas.width - (padding * 2); // Space between outer borders
      photoWidth = (availableWidth - padding) / 2; // Width of each cell
      photoHeight = photoWidth; // Keep cells square
      gridHeight = (photoHeight * 2) + padding;
    }

    // Calculate grid starting position - now at top when no text, or with padding when text exists
    const gridStartY = padding;

    // Calculate text position - now at the bottom with better spacing
    const textStartY = gridStartY + gridHeight + padding + 25; // More generous spacing
    const lineHeight = 42; // Increased line height for better readability

    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        // Don't set crossOrigin for data URLs
        if (!src.startsWith('data:')) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => {
          console.log("Image loaded successfully");
          resolve(img);
        };
        img.onerror = (e) => {
          console.error("Error loading image:", e, "Source:", src.substring(0, 100) + "...");
          reject(e);
        };
        img.src = src;
      });
    };

    const drawAllPhotos = async () => {
      console.log("Drawing photos, count:", photos.length);
      console.log("Layout:", layout);
      console.log("Canvas dimensions:", canvas.width, "x", canvas.height);

      // Draw placeholder borders for empty layout
      if (photos.length === 0) {
        if (layout === "strip") {
          // Strip layout placeholders
          for (let i = 0; i < 4; i++) {
            const x = padding;
            const y = gridStartY + (i * (placeholderHeight + padding));

            tempCtx.strokeStyle = '#e5e5e5';
            tempCtx.lineWidth = 2;
            tempCtx.strokeRect(x, y, placeholderWidth, placeholderHeight);
          }
        } else {
          // Collage layout placeholders (2x2)
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
              const x = padding + (col * (photoWidth + padding));
              const y = gridStartY + (row * (photoHeight + padding));

              tempCtx.strokeStyle = '#e5e5e5';
              tempCtx.lineWidth = 2;
              tempCtx.strokeRect(x, y, photoWidth, photoHeight);
            }
          }
        }
      }

      // Draw actual images
      if (photos.length > 0) {
        const imagesToDraw = Math.min(photos.length, layout === "strip" ? 4 : 4);
        for (let i = 0; i < imagesToDraw; i++) {
          try {
            const img = await loadImage(photos[i]);
            let x: number;
            let y: number;

            if (layout === "strip") {
              x = padding;
              y = gridStartY + (i * (placeholderHeight + padding));

              // Calculate dimensions to maintain aspect ratio and fill placeholder
              const aspectRatio = img.width / img.height;
              let drawWidth = placeholderWidth;
              let drawHeight = placeholderHeight;
              let sourceX = 0;
              let sourceY = 0;
              let sourceWidth = img.width;
              let sourceHeight = img.height;

              if (aspectRatio > (placeholderWidth / placeholderHeight)) {
                // Image is wider - crop sides
                sourceWidth = Math.floor((placeholderWidth / placeholderHeight) * img.height);
                sourceX = Math.floor((img.width - sourceWidth) / 2);
              } else {
                // Image is taller - crop top/bottom
                sourceHeight = Math.floor((placeholderHeight / placeholderWidth) * img.width);
                sourceY = Math.floor((img.height - sourceHeight) / 2);
              }

              tempCtx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, drawWidth, drawHeight);
            } else {
              // For collage layout (2x2 grid)
              const col = i % 2;
              const row = Math.floor(i / 2);
              x = padding + (col * (photoWidth + padding));
              y = gridStartY + (row * (photoHeight + padding));

              // Create a temporary canvas for the covered image
              const tempImgCanvas = document.createElement('canvas');
              const tempImgCtx = tempImgCanvas.getContext('2d');
              tempImgCanvas.width = photoWidth;
              tempImgCanvas.height = photoHeight;

              if (tempImgCtx) {
                const scale = Math.max(photoWidth / img.width, photoHeight / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const offsetX = (photoWidth - scaledWidth) / 2;
                const offsetY = (photoHeight - scaledHeight) / 2;

                tempImgCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
                tempCtx.drawImage(tempImgCanvas, x, y);
              }
            }
          } catch (error) {
            console.error("Error loading photo:", error);
          }
        }
      }

      // Draw title and date at bottom after photos with enhanced styling
      if (showName) {
        const titleSize = layout === "strip" ? 28 : 32; // Increased font sizes for better visibility
        tempCtx.font = `bold ${titleSize}px "Georgia", serif`; // Use serif font for elegance
        tempCtx.textAlign = "center";

        // Add text shadow for depth
        tempCtx.shadowColor = "rgba(0, 0, 0, 0.3)";
        tempCtx.shadowOffsetX = 1;
        tempCtx.shadowOffsetY = 1;
        tempCtx.shadowBlur = 2;

        tempCtx.fillStyle = nameColor;
        tempCtx.fillText(name || "Photo Strip", canvas.width / 2, textStartY);

        // Reset shadow
        tempCtx.shadowColor = "transparent";
        tempCtx.shadowOffsetX = 0;
        tempCtx.shadowOffsetY = 0;
        tempCtx.shadowBlur = 0;
      }

      // Draw date if enabled with enhanced styling
      if (showDate) {
        const dateSize = layout === "strip" ? 18 : 20; // Increased font sizes
        tempCtx.font = `${dateSize}px "Arial", sans-serif`; // Clean sans-serif for date
        tempCtx.textAlign = "center";

        // Add subtle text shadow
        tempCtx.shadowColor = "rgba(0, 0, 0, 0.2)";
        tempCtx.shadowOffsetX = 0.5;
        tempCtx.shadowOffsetY = 0.5;
        tempCtx.shadowBlur = 1;

        tempCtx.fillStyle = dateColor;
        const dateText = format(new Date(), "MMMM dd, yyyy").toUpperCase(); // Uppercase for style
        const dateY = showName ? textStartY + (lineHeight * 0.9) : textStartY; // Slightly tighter spacing
        tempCtx.fillText(dateText, canvas.width / 2, dateY);

        // Reset shadow
        tempCtx.shadowColor = "transparent";
        tempCtx.shadowOffsetX = 0;
        tempCtx.shadowOffsetY = 0;
        tempCtx.shadowBlur = 0;
      }

      // Update main canvas with the final content
      ctx.canvas.width = canvas.width;
      ctx.canvas.height = canvas.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    };

    drawAllPhotos();
  }, [photos, backgroundColor, name, showDate, showName, nameColor, dateColor, layout]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fileName = `${name || 'photo'}-${format(new Date(), 'yyyy-MM-dd')}.png`;

    if (isMobile) {
      try {
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, 'image/png');
        });

        // Create a File object
        const file = new File([blob], fileName, { type: 'image/png' });

        // Check if the Web Share API is available
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Photo Strip',
            text: 'Download or share your photo strip'
          });

          toast({
            title: "Success!",
            description: "Your photo strip is ready to be saved or shared",
            variant: "success",
            duration: 3000,
          });
        } else {
          // Fallback for browsers that don't support sharing files
          const downloadUrl = canvas.toDataURL();
          const link = document.createElement("a");
          link.download = fileName;
          link.href = downloadUrl;
          link.click();

          toast({
            title: "Photo Downloaded",
            description: "Check your device's download folder",
            variant: "success",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error sharing/downloading:', error);
        toast({
          title: "Download Failed",
          description: "There was an error downloading your photo",
          variant: "destructive",
          duration: 3000,
        });
      }
    } else {
      // Desktop download behavior
      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Photo Downloaded",
        description: "Check your downloads folder",
        variant: "success",
        duration: 3000,
      });
    }
  };

  const handleShare = () => {
    if (onShare && typeof onShare === 'function') {
      onShare();
    } else {
      toast({
        title: "Share not available",
        description: "Share functionality is not available for this photo strip",
        variant: "default",
        duration: 2000,
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full px-2 sm:px-0">
      <div className="w-full max-w-[280px] bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 border border-slate-100 dark:border-slate-700">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg shadow-sm"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {!hideButtons && (
        <div className="flex gap-3 mt-2 flex-wrap justify-center">
          <Button onClick={handleDownload} className="px-4 py-2">
            {isMobile ? <ImageIcon className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            <span className="ml-2">Download</span>
          </Button>

          {onSaveToGallery && photos.length > 0 && (
            <Button onClick={onSaveToGallery} variant="outline" className="px-4 py-2">
              <Save className="h-4 w-4" />
              <span className="ml-2">Save</span>
            </Button>
          )}

          {showShareButton && photos.length > 0 && (
            <Button
              onClick={handleShare}
              variant="outline"
              className="px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isShareLoading}
            >
              <Share2 className="h-4 w-4" />
              <span className="ml-2">{isShareLoading ? 'Generating...' : 'Share'}</span>
            </Button>
          )}
        </div>
      )}

      {photoStripId && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          photoStripId={photoStripId}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};