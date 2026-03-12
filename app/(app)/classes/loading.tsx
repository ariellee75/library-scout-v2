import Image from "next/image"

export default function ClassesLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      {/* Progress bar at top */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 overflow-hidden bg-muted">
        <div 
          className="h-full bg-primary animate-[progress_2s_ease-in-out_infinite]"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>

      {/* Animated statue with lightbulb - gentle floating */}
      <div className="relative mb-6">
        <div className="animate-[float_2.5s_ease-in-out_infinite] relative w-[140px] h-[180px]">
          <Image
            src="/images/loading-state.png"
            alt="Thinking statue with lightbulb"
            fill
            className="opacity-90 object-contain"
            priority
          />
        </div>
        {/* Lightbulb glow effect */}
        <div className="absolute -top-4 left-1/2 h-16 w-16 -translate-x-1/2 animate-pulse rounded-full bg-amber-400/30 blur-2xl" />
      </div>

      {/* Progress indicator */}
      <div className="mb-4 w-48">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div 
            className="h-full rounded-full bg-primary animate-[shimmer_1.5s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.5) 50%, hsl(var(--primary)) 100%)",
              backgroundSize: "200% 100%",
            }}
          />
        </div>
      </div>
      
      <p className="animate-pulse text-sm text-muted-foreground">
        Discovering classes...
      </p>
    </div>
  )
}
