import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { PhotoBoothCamera } from "@/components/photo-booth/camera";
import { Countdown } from "@/components/photo-booth/countdown";
import { ColorPicker } from "@/components/photo-booth/color-picker";
import { PhotoStrip } from "@/components/photo-booth/photo-strip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Camera, Trash2, Settings, Repeat, Download, ChevronLeft, ChevronRight, Share2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StepProgress } from "@/components/photo-booth/step-progress";
import { useLocation } from 'wouter';
import QRCode from 'react-qr-code';

// Define an interface for the stored photo strip data
interface StoredPhotoStrip {
  id: string;
  timestamp: number;
  stripData: {
    photos: string[];
    layout: "strip" | "collage";
    backgroundColor: string;
    stripName: string;
    showDate: boolean;
    showName: boolean;
    nameColor: string;
    dateColor: string;
  };
}

export default function Home() {
  const { userId } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#E1D9D1");
  const [stripName, setStripName] = useState("");
  const [showDate, setShowDate] = useState(true);
  const [showName, setShowName] = useState(true);
  const [nameColor, setNameColor] = useState("#000000");
  const [dateColor, setDateColor] = useState("#666666");
  const [layout, setLayout] = useState<"strip" | "collage">("strip");
  const [timerDuration, setTimerDuration] = useState(5);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const autoCaptureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [isShareGenerating, setIsShareGenerating] = useState(false);
  const clearAutoCaptureTimer = () => {
    if (autoCaptureTimer.current) {
      clearTimeout(autoCaptureTimer.current);
      autoCaptureTimer.current = null;
    }
  };

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Apply dark mode to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    return () => {
      clearAutoCaptureTimer();
    };
  }, []);

  const handleCapture = (photo: string) => {
    if (recaptureIndex !== null) {
      // Replace photo at specific index
      const updatedPhotos = [...photos];
      updatedPhotos[recaptureIndex] = photo;
      setPhotos(updatedPhotos);
      setRecaptureIndex(null);
      setIsCountingDown(false);

      toast({
        title: "Photo recaptured",
        description: `Photo ${recaptureIndex + 1} has been updated`,
        variant: "default",
        duration: 2000,
      });
    } else {
      const nextPhotoCount = photos.length + 1;
      setPhotos((prev) => [...prev, photo]);
      setIsCountingDown(false);
      clearAutoCaptureTimer();

      if (isAutoCapturing) {
        if (nextPhotoCount < 4) {
          autoCaptureTimer.current = setTimeout(() => {
            setIsCountingDown(true);
          }, 1500);
        } else {
          setIsAutoCapturing(false);
        }
      }
    }
  };

  const handleStartPhotoSequence = () => {
    if (photos.length >= 4) {
      toast({
        title: "Maximum photos reached",
        description: "Please clear the photos to start over.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    // Clear existing photos when starting a new sequence
    clearAutoCaptureTimer();
    setPhotos([]);
    setRecaptureIndex(null);
    setIsAutoCapturing(true);
    // Start the countdown for the first photo
    setIsCountingDown(true);
  };

  const handleClear = () => {
    setPhotos([]);
    setRecaptureIndex(null);
    setIsCountingDown(false);
    setIsAutoCapturing(false);
    clearAutoCaptureTimer();
  };

  const [recaptureIndex, setRecaptureIndex] = useState<number | null>(null);

  const handleRetakePhoto = (index: number) => {
    setRecaptureIndex(index);

    toast({
      title: "Recapture mode",
      description: `Click Auto Capture or the camera button to recapture Photo ${index + 1}`,
      variant: "default",
      duration: 3000,
    });
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 1));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleShare = async () => {
    if (isShareGenerating) return;
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create a shareable link",
        variant: "destructive",
      });
      return;
    }
    setIsShareGenerating(true);

    try {
      // First, save the photo strip
      const response = await fetch("/api/photo-strips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          photos,
          layout,
          backgroundColor,
          stripName,
          showDate,
          showName,
          nameColor,
          dateColor,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save photo strip");
      }

      const savedPhotoStrip = await response.json();

      // Then create a share link
      const shareResponse = await fetch("/api/shared-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ photoStripId: savedPhotoStrip.id }),
      });

      if (!shareResponse.ok) {
        throw new Error("Failed to generate share link");
      }

      const shareData = await shareResponse.json();
      const fullUrl = `${window.location.origin}${shareData.url}`;
      setShareUrl(fullUrl);
      setShareModalOpen(true);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setIsShareGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied",
      description: "The shareable link has been copied to your clipboard.",
      variant: "default",
      duration: 2000,
    });
  };

  // Function to save photo strip to local storage
  const saveToGallery = () => {
    const newStrip = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      photos,
      layout,
      backgroundColor,
      stripName,
      showDate,
      showName,
      nameColor,
      dateColor,
    };

    try {
      // Calculate approximate size of the data
      const stripJson = JSON.stringify(newStrip);
      const stripSizeInBytes = new Blob([stripJson]).size;
      const stripSizeInMB = stripSizeInBytes / (1024 * 1024);

      // Warn if strip is larger than 2MB
      if (stripSizeInMB > 2) {
        toast({
          title: "Warning",
          description: `This photo strip is ${stripSizeInMB.toFixed(2)}MB. It may take up significant storage space.`,
          variant: "default",
        });
      }

      // Check localStorage space before saving
      const testKey = `__test_size_${Date.now()}__`;
      
      try {
        localStorage.setItem(testKey, stripJson);
        localStorage.removeItem(testKey);
      } catch (e) {
        if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          toast({
            title: "Storage Full",
            description: "Local storage is full. Please clear some old photo strips from your gallery or browser storage to save new ones.",
            variant: "destructive",
          });
          return;
        }
        throw e;
      }

      const existingStripsJson = localStorage.getItem("photoStrips");
      const existingStrips = existingStripsJson
        ? JSON.parse(existingStripsJson)
        : [];

      const updatedStrips = [...existingStrips, newStrip];
      
      try {
        localStorage.setItem("photoStrips", JSON.stringify(updatedStrips));
      } catch (e) {
        if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          toast({
            title: "Storage Full",
            description: "Local storage is full. Cannot save this photo strip. Please delete some strips from your gallery.",
            variant: "destructive",
          });
          return;
        }
        throw e;
      }

      toast({
        title: "Saved to Gallery",
        description: "Your photo strip has been saved locally.",
        variant: "default",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error saving to gallery:", error);
      toast({
        title: "Error",
        description: "Failed to save to gallery. Please check your browser storage or clear space.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`min-h-screen pt-20 pb-8 px-4 sm:px-6 transition-all duration-300 ${darkMode ? 'dark bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'}`}>
      <div className="mt-6">
        {currentStep === 0 ? (
          <div className={`space-y-6 rounded-2xl shadow-lg p-6 sm:p-8 max-w-6xl mx-auto ${darkMode ? 'dark:bg-slate-800 dark:border-slate-700 border border-slate-700 dark:shadow-2xl' : 'bg-white border border-slate-100 shadow-xl'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6 sm:gap-8">
              {/* Camera Section */}
              <div className="space-y-4 order-2 lg:order-1">
                <div className="relative w-full rounded-xl overflow-hidden shadow-lg hover-lift">
                  <PhotoBoothCamera
                    onCapture={handleCapture}
                    isCountingDown={isCountingDown}
                    timerDuration={timerDuration}
                    photosLength={photos.length}
                    recaptureIndex={recaptureIndex}
                    onMaxPhotos={() => {
                      toast({
                        title: "Maximum photos reached",
                        description: "Please clear the photos to start over.",
                        variant: "destructive",
                      });
                    }}
                  />
                  <Countdown
                    isActive={isCountingDown}
                    onComplete={handleCapture}
                    duration={timerDuration}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {photos.length < 4 || recaptureIndex !== null ? (
                      <Button
                        onClick={() => {
                          if (recaptureIndex !== null) {
                            setIsCountingDown(true);
                          } else {
                            handleStartPhotoSequence();
                          }
                        }}
                    disabled={isCountingDown || isAutoCapturing}
                    className="flex items-center gap-2 flex-1 sm:flex-none text-sm sm:text-base bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Camera className="h-4 w-4" />
                        <span className="hidden sm:inline">{recaptureIndex !== null ? `Recapture Photo ${recaptureIndex + 1}` : 'Auto Capture'}</span>
                        <span className="sm:hidden">{recaptureIndex !== null ? `Recapture` : 'Capture'}</span>
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        className="flex items-center gap-2 flex-1 sm:flex-none text-sm sm:text-base bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPhotos([]);
                        setRecaptureIndex(null);
                      }}
                      disabled={photos.length === 0}
                      className="flex items-center gap-2 flex-1 sm:flex-none text-xs sm:text-sm hover-lift transition-all duration-200"
                    >
                      <Repeat className="h-4 w-4" />
                      <span className="hidden sm:inline">Retake All</span>
                      <span className="sm:hidden">Retake</span>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center justify-center w-10 h-10 p-0 hover-lift transition-all duration-200"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-left bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">RoBooth Settings</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="timer-duration">Timer Duration (seconds)</Label>
                              <div className="flex items-center gap-4">
                                <Input
                                  id="timer-duration"
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={timerDuration}
                                  onChange={(e) => setTimerDuration(parseInt(e.target.value) || 5)}
                                  className="w-24"
                                />
                                <span className="text-sm text-gray-500">Countdown time before each photo</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div className="space-y-0.5">
                                <Label htmlFor="dark-mode">Dark Mode</Label>
                                <p className="text-sm text-gray-500">Enable dark theme</p>
                              </div>
                              <Switch
                                id="dark-mode"
                                checked={darkMode}
                                onCheckedChange={setDarkMode}
                              />
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              {/* Preview Grid */}

              <div className="space-y-3">
                  <h3 className={`text-lg font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent`}>
                    Photo Preview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                        key={index}
                        className={`aspect-[4/3] rounded-lg border transition-all duration-300 hover-lift ${
                          photos[index]
                            ? 'border-green-400 bg-green-50 shadow-md'
                            : index === photos.length
                            ? 'border-sky-400 bg-gradient-to-br from-sky-50 to-indigo-50 shadow-md'
                            : darkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-white'
                        }
                        flex items-center justify-center relative overflow-hidden group cursor-pointer`}
                        onClick={() => {
                          if (photos[index]) {
                            handleRetakePhoto(index);
                          }
                        }}
                      >
                        {photos[index] ? (
                          <>
                            <img
                              src={photos[index]}
                              alt={`Captured ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                              ✓
                            </div>
                            {/* Hover overlay for retake */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
                              <div className="text-white text-center animate-fade-in">
                                <Trash2 className="h-6 w-6 mx-auto mb-1" />
                                <span className="text-xs font-medium">Retake</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <div className={`w-10 h-10 rounded-full ${
                              index === photos.length
                                ? 'bg-gradient-to-br from-sky-200 to-indigo-200 border-2 border-sky-400 shadow-md'
                                : darkMode ? 'bg-slate-600 border-2 border-slate-500' : 'bg-slate-100 border-2 border-slate-300'
                            } flex items-center justify-center mb-2 transition-all duration-300`}>
                              <Camera className={`h-5 w-5 ${
                                index === photos.length ? 'text-sky-600' : darkMode ? 'text-slate-400' : 'text-slate-400'
                              }`} />
                            </div>
                            <span className={`text-xs font-medium ${
                              index === photos.length ? 'text-sky-600 font-semibold' : darkMode ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {index === photos.length ? 'Next' : `Photo ${index + 1}`}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {photos.length > 0 && (
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} text-center animate-fade-in`}>
                      Click on any photo to retake it
                    </p>
                  )}
                </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className={`space-y-6 ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'} rounded-2xl shadow-lg p-4 sm:p-6`}>
              <div className="flex items-center mb-4">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  className="flex items-center gap-2 text-sm sm:text-base hover-lift transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="strip-name" className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-slate-100' : ''}`}>Strip Name</Label>
                  <Input
                    id="strip-name"
                    value={stripName}
                    onChange={(e) => setStripName(e.target.value)}
                    placeholder="Enter a name for your strip"
                    className={`text-sm ${darkMode ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400' : 'bg-white'} rounded-lg transition-all duration-200 focus:ring-2 focus:ring-sky-500`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-slate-100' : ''}`}>Layout Style</Label>
                  <div className="flex gap-2 sm:gap-4 flex-col xs:flex-row">
                    <div
                      className={`flex-1 p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-300 hover-lift ${
                        layout === "strip"
                          ? darkMode
                            ? "border-sky-500 bg-sky-500/10 shadow-md"
                            : "border-sky-500 bg-sky-50 shadow-md"
                          : darkMode
                            ? "border-slate-600 hover:border-sky-500/50 bg-slate-700"
                            : "border-slate-200 hover:border-sky-500/50 hover:bg-slate-50"
                      }`}
                      onClick={() => setLayout("strip")}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-16 h-24 sm:w-20 sm:h-[120px] ${darkMode ? 'bg-slate-600' : 'bg-slate-200'} rounded flex flex-col gap-1 p-1`}>
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={`flex-1 ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded`} />
                          ))}
                        </div>
                        <span className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-slate-100' : ''}`}>Strip</span>
                        <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>1x4</span>
                      </div>
                    </div>
                    <div
                      className={`flex-1 p-3 sm:p-4 border rounded-xl cursor-pointer transition-all duration-300 hover-lift ${
                        layout === "collage"
                          ? darkMode
                            ? "border-sky-500 bg-sky-500/10 shadow-md"
                            : "border-sky-500 bg-sky-50 shadow-md"
                          : darkMode
                            ? "border-slate-600 hover:border-sky-500/50 bg-slate-700"
                            : "border-slate-200 hover:border-sky-500/50 hover:bg-slate-50"
                      }`}
                      onClick={() => setLayout("collage")}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 ${darkMode ? 'bg-slate-600' : 'bg-slate-200'} rounded grid grid-cols-2 gap-1 p-1`}>
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={`aspect-[4/3] ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded`} />
                          ))}
                        </div>
                        <span className={`text-xs sm:text-sm font-bold ${darkMode ? 'text-slate-100' : ''}`}>Collage</span>
                        <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>2x2</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-slate-100' : ''}`}>Display Options</Label>
                  <div className={`${darkMode ? 'bg-slate-700 border border-slate-600' : 'bg-slate-50 border border-slate-200'} rounded-xl p-3 sm:p-4 space-y-4`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5 flex-1">
                        <Label htmlFor="show-name" className={`text-xs sm:text-sm ${darkMode ? 'text-slate-100' : ''}`}>Show Strip Name</Label>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Display name</p>
                      </div>
                      <Switch
                        id="show-name"
                        checked={showName}
                        onCheckedChange={setShowName}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5 flex-1">
                        <Label htmlFor="show-date" className={`text-xs sm:text-sm ${darkMode ? 'text-slate-100' : ''}`}>Show Date</Label>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Include date</p>
                      </div>
                      <Switch
                        id="show-date"
                        checked={showDate}
                        onCheckedChange={setShowDate}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-slate-100' : ''}`}>Colors</Label>
                  <div className={`${darkMode ? 'bg-slate-700 border border-slate-600' : 'bg-slate-50 border border-slate-200'} rounded-xl p-3 sm:p-4 space-y-3`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="background-color" className={`text-xs sm:text-sm ${darkMode ? 'text-slate-100' : ''}`}>Background</Label>
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="h-8 w-12 sm:w-16 rounded-lg cursor-pointer hover-lift transition-all duration-200 border border-slate-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="name-color" className={`text-xs sm:text-sm ${darkMode ? 'text-slate-100' : ''}`}>Name Color</Label>
                        <input
                          type="color"
                          value={nameColor}
                          onChange={(e) => setNameColor(e.target.value)}
                          className="h-8 w-12 sm:w-16 rounded-lg cursor-pointer hover-lift transition-all duration-200 border border-slate-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="date-color" className={`text-xs sm:text-sm ${darkMode ? 'text-slate-100' : ''}`}>Date Color</Label>
                        <input
                          type="color"
                          value={dateColor}
                          onChange={(e) => setDateColor(e.target.value)}
                          className="h-8 w-12 sm:w-16 rounded-lg cursor-pointer hover-lift transition-all duration-200 border border-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
              <div className={`w-full flex justify-center ${darkMode ? 'bg-slate-700 border border-slate-600 shadow-xl' : 'bg-white border border-slate-100 shadow-lg'} rounded-2xl p-3 sm:p-4 hover-lift transition-all duration-300`}>
                <div className={`${layout === 'strip' ? 'max-w-xs' : 'max-w-md'} w-full`}>
                  <PhotoStrip
                    photos={photos}
                    layout={layout}
                    name={stripName}
                    showDate={showDate}
                    showName={showName}
                    backgroundColor={backgroundColor}
                    nameColor={nameColor}
                    dateColor={dateColor}
                    darkMode={darkMode}
                    showShareButton={true}
                    isShareLoading={isShareGenerating}
                    onShare={handleShare}
                    onSaveToGallery={saveToGallery}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Share Your Photo Strip</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="text-center overflow-auto max-h-80">
              {shareUrl && <QRCode value={shareUrl} size={Math.min(256, window.innerWidth - 60)} />}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input id="share-url" value={shareUrl} readOnly className="flex-1 text-xs sm:text-base rounded-lg" />
              <Button onClick={handleCopyLink} className="w-full sm:w-auto text-xs sm:text-base bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">Copy Link</Button>
            </div>
            <p className="text-xs sm:text-sm text-center text-slate-500">Scan the QR code or copy the link to share.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}