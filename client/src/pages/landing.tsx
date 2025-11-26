/// <reference types="react" />
import * as React from "react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Camera, Heart, Sparkles, Zap, Users, Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  useEffect(() => {
    let mounted = true;

    const incrementVisitorCount = async () => {
      try {
        const res = await fetch("/api/visitors/increment", { method: "POST" });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        if (typeof window !== "undefined" && typeof data?.count === "number") {
          window.dispatchEvent(new CustomEvent("visitor-count-updated", { detail: { count: data.count } }));
        }
      } catch (error) {
        console.error("Failed to update visitor count", error);
      }
    };

    incrementVisitorCount();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-12 pb-32 md:pb-40">
          {/* Hero Section - Full Screen Immersive */}
          <div className="text-center max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
            {/* Main Logo and Title */}
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-3xl blur-3xl opacity-75 animate-glow-pulse"></div>
                  <div className="relative w-28 h-28 md:w-32 md:h-32 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 animate-float">
                    <Camera className="h-14 md:h-16 w-14 md:w-16 text-white" />
                  </div>
                </div>
              </div>
            
              <div className="space-y-4">
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: "200% 200%" }}>
                  RoBooth
                </h1>
                <div className="mt-3 flex justify-center">
                  <div className="h-1 w-48 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 opacity-80 animate-shimmer" />
                </div>
                <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Capture • Create • Share
                </p>
                <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                  A delightful photobooth for quick memories — modern UI, friendly animations, and instant downloads.
                </p>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-lg md:text-2xl text-slate-700 dark:text-slate-200 max-w-3xl mx-auto leading-relaxed font-medium animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Experience the magic of instant photo memories. Modern design, intuitive controls, and instant sharing — all in one beautiful photobooth.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full animate-fade-in pt-4" style={{ animationDelay: "0.4s" }}>
              <Button 
                size="lg" 
                onClick={() => setLocation("/home")} 
                className="px-12 py-4 text-lg font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 hover-lift"
              >
                <Camera className="h-6 w-6 mr-3" />
                Start Photo Booth
              </Button>

              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setLocation("/gallery")} 
                className="px-12 py-4 text-lg font-bold border-2 border-sky-500 text-sky-600 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <ImageIcon className="h-6 w-6 mr-3" />
                View Gallery
              </Button>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 backdrop-blur-md border border-sky-100 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-sky-500" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">4 Photo Strip</div>
                    <div className="text-xs text-slate-500 dark:text-slate-300">Create classic vertical strips</div>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 backdrop-blur-md border border-blue-100 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-blue-500" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Instant Share</div>
                    <div className="text-xs text-slate-500 dark:text-slate-300">Share links and downloads instantly</div>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 backdrop-blur-md border border-indigo-100 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Download className="h-6 w-6 text-indigo-500" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Download</div>
                    <div className="text-xs text-slate-500 dark:text-slate-300">Export high-quality PNGs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer (now in-flow so it follows the UI sequence) */}
          <div className="mt-8 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 py-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700">
            <span className="font-semibold">by Influenzah</span>
            <span className="text-slate-400">•</span>
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-bold transition-all duration-200 hover:scale-110">
                  Privacy Policy
                </button>
              </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent text-center">
                  Features & Privacy Policy
                </DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-8 py-6">
                {/* Features Column */}
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent mb-6">
                    Features
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-sky-100 dark:border-slate-600 hover-lift">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <span className="inline-block w-3 h-3 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full mr-3 shadow-lg"></span>
                        Photo Booth Experience
                      </h3>
                      <ul className="text-slate-700 dark:text-slate-200 pl-5 list-disc ml-4 space-y-2 font-medium">
                        <li>Take up to 4 photos in sequence</li>
                        <li>Automatic countdown timer</li>
                        <li>Camera flip and mirror controls</li>
                        <li>Mobile device support</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-sky-100 dark:border-slate-600 hover-lift">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <span className="inline-block w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-3 shadow-lg"></span>
                        Customization Options
                      </h3>
                      <ul className="text-slate-700 dark:text-slate-200 pl-5 list-disc ml-4 space-y-2 font-medium">
                        <li>Strip and collage layouts</li>
                        <li>Custom strip name</li>
                        <li>Adjustable timer duration</li>
                        <li>Background color selection</li>
                        <li>Date and name display options</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-sky-100 dark:border-slate-600 hover-lift">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <span className="inline-block w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3 shadow-lg"></span>
                        User Interface
                      </h3>
                      <ul className="text-slate-700 dark:text-slate-200 pl-5 list-disc ml-4 space-y-2 font-medium">
                        <li>Modern, intuitive design</li>
                        <li>Real-time camera preview</li>
                        <li>Interactive controls</li>
                        <li>Status notifications and toasts</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Privacy Policy Column */}
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent mb-6">
                    Privacy Policy
                  </h2>
                  <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-sm mb-8 border border-sky-100 dark:border-slate-600">
                    <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                      Your privacy is my priority. This policy explains how your
                      images and personal data are handled.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-sky-100 dark:border-slate-600 hover-lift">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <span className="inline-block w-3 h-3 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full mr-3 shadow-lg"></span>
                        Image Processing
                      </h3>
                      <p className="text-slate-700 dark:text-slate-200 pl-5 font-medium">
                        All image processing happens locally within your browser
                        on your device. No images are uploaded to external
                        servers.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-sky-100 dark:border-slate-600 hover-lift">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <span className="inline-block w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-3 shadow-lg"></span>
                        Data Collection
                      </h3>
                      <p className="text-slate-700 dark:text-slate-200 pl-5 font-medium">
                        I do not collect or store any images you process with
                        this application. Your images stay entirely on your
                        device.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-sky-100 dark:border-slate-600 hover-lift">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <span className="inline-block w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-3 shadow-lg"></span>
                        No Server Transmission
                      </h3>
                      <p className="text-slate-700 dark:text-slate-200 pl-5 font-medium">
                        All processing is done client-side, ensuring that your
                        images are never transmitted to any servers.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-sky-100 dark:border-slate-600 hover-lift">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <span className="inline-block w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mr-3 shadow-lg"></span>
                        Third-Party Services
                      </h3>
                      <p className="text-slate-700 dark:text-slate-200 pl-5 font-medium">
                        No third-party services are used that would require
                        uploading or sharing your images.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-sky-100 dark:border-slate-600 hover-lift">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                        <span className="inline-block w-3 h-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-full mr-3 shadow-lg"></span>
                        Policy Updates
                      </h3>
                      <p className="text-slate-700 dark:text-slate-200 pl-5 font-medium">
                        This privacy policy may be updated periodically, with
                        any changes posted on this page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
