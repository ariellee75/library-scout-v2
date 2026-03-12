"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, Heart, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function KofiButton() {
  const [open, setOpen] = useState(false)
  const [wiggle, setWiggle] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Periodic wiggle every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWiggle(true)
      setTimeout(() => setWiggle(false), 1200)
    }, 8000)
    // Initial wiggle after 3 seconds
    const initial = setTimeout(() => {
      setWiggle(true)
      setTimeout(() => setWiggle(false), 1200)
    }, 3000)
    return () => {
      clearInterval(interval)
      clearTimeout(initial)
    }
  }, [])

  // Auto-expand "Donate" label once per hour (with localStorage to persist across page loads)
  useEffect(() => {
    const HOUR_MS = 60 * 60 * 1000
    const STORAGE_KEY = "kofi-last-auto-expand"
    
    const autoReveal = () => {
      setHovered(true)
      setTimeout(() => setHovered(false), 3000)
      try {
        localStorage.setItem(STORAGE_KEY, Date.now().toString())
      } catch { /* ignore */ }
    }
    
    // Check when we last auto-expanded
    let lastExpand = 0
    try {
      lastExpand = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10)
    } catch { /* ignore */ }
    
    const timeSinceLast = Date.now() - lastExpand
    
    // If it's been more than an hour, reveal after 30 seconds
    if (timeSinceLast > HOUR_MS) {
      const firstReveal = setTimeout(autoReveal, 30_000)
      return () => clearTimeout(firstReveal)
    }
    
    // Otherwise schedule next reveal for when the hour is up
    const remaining = HOUR_MS - timeSinceLast
    const scheduled = setTimeout(autoReveal, remaining)
    return () => clearTimeout(scheduled)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "fixed right-4 z-[55] flex items-center rounded-full shadow-lg transition-all duration-300",
          "bottom-[4.5rem] lg:bottom-4",
          "hover:shadow-xl hover:scale-110 active:scale-95",
          wiggle && "matcha-wiggle"
        )}
        aria-label="Support this project"
      >
        {/* Matcha drink image */}
        <div className="relative h-[4.2rem] w-[4.2rem] shrink-0">
          <Image
            src="/images/matcha.png"
            alt="Strawberry matcha drink"
            width={67}
            height={67}
            priority
            className="h-full w-full object-contain drop-shadow-md"
          />
        </div>

        {/* "Donate" label that slides out on hover */}
        <span
          className={cn(
            "overflow-hidden whitespace-nowrap rounded-full bg-foreground px-0 text-sm font-bold text-background transition-all duration-300 ease-out",
            hovered
              ? "ml-1 w-[4.5rem] px-3 py-1.5 opacity-100"
              : "ml-0 w-0 opacity-0"
          )}
        >
          Donate
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "sm:max-w-md bg-card text-card-foreground",
            open && "animate-in fade-in-0 zoom-in-95"
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold font-serif text-foreground">
              <Heart className="h-5 w-5 text-primary" />
              Support Library Scout
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This is an open source project
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <p className="text-sm leading-relaxed text-foreground">
              Library Scout is built and maintained by one person as a free, open
              source tool for the community. If you find it useful, buying a
              matcha helps cover the cost of hosting, databases, and keeping
              everything running.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Haha it genuinely costs money to build and maintain this -- every
              little bit helps keep the lights on!
            </p>
            <div className="flex gap-2">
              <Button
                asChild
                className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <a
                  href="https://ko-fi.com/libraryscout"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Buy me a matcha
                </a>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
