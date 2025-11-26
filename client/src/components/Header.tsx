import React, { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/clerk-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Camera, Home, Menu } from "lucide-react";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [visitors, setVisitors] = useState<number | null>(null);
  
  // Fetch visitor count and setup polling for real-time sync
  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchCurrent = async () => {
      try {
        const res = await fetch('/api/visitors');
        if (!res.ok) return null;
        const data = await res.json();
        return typeof data?.count === 'number' ? data.count : null;
      } catch (e) {
        console.error('Visitor count fetch failed', e);
        return null;
      }
    };

    const syncVisitorCount = async () => {
      const current = await fetchCurrent();
      if (mounted && current !== null) {
        setVisitors(current);
      }
    };

    syncVisitorCount();

    pollInterval = setInterval(() => {
      void syncVisitorCount();
    }, 5000);

    const handleVisitorEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ count?: number }>).detail;
      if (detail && typeof detail.count === 'number') {
        setVisitors(detail.count);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('visitor-count-updated', handleVisitorEvent);
    }

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('visitor-count-updated', handleVisitorEvent);
      }
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white/80 via-blue-50/80 to-indigo-50/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-16">
          <div className="flex items-center gap-2">
            {/* Logo and Title (simplified) */}
            <div
              className="flex items-center gap-3 cursor-pointer hover-lift rounded-lg px-2 py-1"
              onClick={() => setLocation("/")}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">RoBooth</span>
            </div>

            {/* Desktop Navigation (closer to logo) */}
            <nav className="hidden md:flex items-center gap-1">
              <SignedIn>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/home")} className="text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-800 hover:text-sky-600 dark:hover:text-sky-300 transition-all duration-200 hover-lift">
                  <Camera className="h-4 w-4" />
                  <span className="ml-1 font-medium">Photo Booth</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLocation("/gallery")} className="text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-800 hover:text-sky-600 dark:hover:text-sky-300 transition-all duration-200 hover-lift">
                  <Home className="h-4 w-4" />
                  <span className="ml-1 font-medium">Gallery</span>
                </Button>
              </SignedIn>
            </nav>
          </div>

          {/* Auth & Support Section (simple) */}
          <div className="flex items-center gap-3">
            {/* Visitor Count (desktop only) as badge */}
            <div className="hidden lg:flex items-center">
              <Badge variant="outline" className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-sky-500">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 20v-1c0-2.21 3.58-4 6-4s6 1.79 6 4v1H6z" fill="currentColor" />
                </svg>
                <span className="text-sm">{visitors === null ? 'Visitors: —' : `Visitors: ${visitors.toLocaleString()}`}</span>
              </Badge>
            </div>
            {/* Support button */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-transparent text-slate-700 dark:text-slate-200 hover:bg-gradient-to-r hover:from-sky-50 hover:to-indigo-50 dark:hover:from-slate-800 dark:hover:to-slate-800 transition-all duration-200 hover-lift">
                  <HeartIcon />
                  <span className="text-sm font-medium">Support</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Support RoBooth</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">Thank you for supporting RoBooth. You can scan the QR code below or use the account number to donate.</p>
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 flex items-center justify-center border border-pink-100 dark:border-slate-600">
                    <img src="/IMG_9239.jpeg" alt="Support QR" className="w-48 h-48 object-contain" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <SignedOut>
              <SignInButton mode="modal">
                <Button size="sm" className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} afterSignOutUrl="/" />
            </SignedIn>

            {/* Mobile menu trigger placed beside the profile */}
            <div className="md:hidden">
              <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DrawerTrigger asChild>
                  <button className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Menu</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-4 space-y-3">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { setLocation('/home'); setMobileMenuOpen(false); }}>
                      <Camera className="h-4 w-4 mr-3" /> Photo Booth
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { setLocation('/gallery'); setMobileMenuOpen(false); }}>
                      <Home className="h-4 w-4 mr-3" /> Gallery
                    </Button>
                  </div>
                  <div className="px-4 py-3 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold">Visitors</div>
                      <div className="text-sm text-slate-600"><Badge variant="outline">{visitors === null ? '—' : visitors.toLocaleString()}</Badge></div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start" variant="outline">
                          <span className="mr-2">💖</span> Support
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Support RoBooth</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <p className="text-sm text-slate-600 dark:text-slate-300">Thank you for supporting RoBooth. You can scan the QR code below or use the account number to donate.</p>
                          <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 flex items-center justify-center border border-pink-100 dark:border-slate-600">
                            <img src="/IMG_9239.jpeg" alt="Support QR" className="w-48 h-48 object-contain" />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <DrawerFooter>
                    <div className="px-4 w-full">
                      <SignedOut>
                        <SignInButton mode="modal">
                          <Button className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white">Sign In</Button>
                        </SignInButton>
                      </SignedOut>
                    </div>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </div>

        
      </div>
    </header>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-pink-500">
      <path d="M12 21s-7-4.438-9-8.5C0 7.5 3 3 7.5 3 10 3 12 5 12 5s2-2 4.5-2C21 3 24 7.5 21 12.5 19 16.562 12 21 12 21z" fill="currentColor" />
    </svg>
  );
}
