"use client"

import { MapPin, ExternalLink } from "lucide-react"
import { findLibrary, getGoogleMapsUrl } from "@/lib/nypl-locations"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface LocationLinkProps {
  location: string
  className?: string
  iconClassName?: string
  showIcon?: boolean
  compact?: boolean
}

export function LocationLink({
  location,
  className,
  iconClassName,
  showIcon = true,
  compact = false,
}: LocationLinkProps) {
  if (!location || location === "Unknown") return null

  const library = findLibrary(location)
  const address = library?.address
  const mapsUrl = address ? getGoogleMapsUrl(address) : getGoogleMapsUrl(location)
  const borough = library?.borough

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex items-start gap-1.5 text-muted-foreground hover:text-primary transition-colors group min-w-0",
                className
              )}
            >
              {showIcon && (
                <MapPin className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5", iconClassName)} />
              )}
              <span className="break-words group-hover:underline">{location}</span>
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-xs">
            <p className="font-medium">{location}</p>
            {borough && <p className="text-muted-foreground">{borough}</p>}
            {address && <p className="text-muted-foreground mt-1">{address}</p>}
            <p className="text-primary mt-1 flex items-center gap-1">
              Open in Google Maps <ExternalLink className="h-3 w-3" />
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "inline-flex items-start gap-1.5 text-muted-foreground hover:text-primary transition-colors group min-w-0",
              className
            )}
          >
            {showIcon && (
              <MapPin className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5", iconClassName)} />
            )}
            <span className="break-words [overflow-wrap:anywhere] group-hover:underline">{location}</span>
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          <p className="font-medium">{location}</p>
          {borough && <p className="text-muted-foreground">{borough}</p>}
          {address && <p className="text-muted-foreground mt-1">{address}</p>}
          <p className="text-primary mt-1 flex items-center gap-1">
            Open in Google Maps <ExternalLink className="h-3 w-3" />
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
