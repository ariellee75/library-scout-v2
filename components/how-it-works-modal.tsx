"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const TIPS = [
  {
    image: "/images/compass.png",
    title: "Discover",
    description: "Browse hundreds of free library classes. Use filters to narrow by time, date, format, or category. Tap the magnifying glass to search by keyword.",
  },
  {
    image: "/images/folder.png",
    title: "Save",
    description: "Tap the bookmark icon on any class to save it to your personal list. Access your saved classes anytime from the Saved tab in the sidebar.",
  },
  {
    image: "/images/megaphone.png",
    title: "Rate & Share",
    description: "After attending a class, mark it as attended and leave feedback to help other community members find great programs. Your reviews make the catalogue better for everyone!",
  },
]

export function HowItWorksModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating button -- lower left */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed left-4 z-[55] flex items-center gap-2 rounded-full bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-lg border border-border transition-all hover:text-foreground hover:shadow-xl",
          "bottom-[4.5rem] lg:bottom-4" // Above mobile nav, normal on desktop
        )}
      >
        <HelpCircle className="h-4 w-4" />
        <span className="hidden sm:inline">How it works</span>
      </button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl">
              <Image
                src="/images/compass.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              How Library Scout Works
            </DialogTitle>
            <DialogDescription>
              Tips to help you get the most out of Library Scout
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-5">
            {TIPS.map((tip) => (
              <div key={tip.title} className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                  <Image
                    src={tip.image}
                    alt={tip.title}
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{tip.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {tip.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">What is "classes attended"?</strong> When you mark a class as attended and leave feedback, it counts toward our community goal of 100K classes attended. Every class you attend helps show the impact of free library programs!
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Pro tip:</strong> Set your interests in your profile to get personalized class recommendations tailored just for you!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
