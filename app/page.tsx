"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  BookOpen,
  Search,
  Bookmark,
  Star,
  Sparkles,
  ArrowRight,
  X,
  Flame,
  Plus,
  Minus,
  MessageSquare,
  CalendarDays,
  MapPin,
  ExternalLink,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { LibraryClass } from "@/lib/types"
import { getArchetypeStyle } from "@/lib/archetype-styles"

/* ── Preview class type ──────────────────────────────────── */
interface PreviewClass {
  id: string
  class_name: string
  archetype: string | null
  description: string
  date: string | null
  time: string | null
  location: string | null
  format: string | null
  link: string | null
}

const FALLBACK_CLASSES: PreviewClass[] = [
  {
    id: "preview-1",
    class_name: "Intro to Crochet",
    archetype: "Makers",
    description: "Learn the basics of crochet in this beginner-friendly hands-on workshop.",
    date: "March 5, 2026",
    time: "2:00 PM",
    location: "Mid-Manhattan Library",
    format: "In person",
    link: null,
  },
  {
    id: "preview-2",
    class_name: "Community Skillshare: Sound Design 201",
    archetype: "Socializers",
    description: "An intermediate workshop on sound design techniques using free tools.",
    date: "March 8, 2026",
    time: "11:00 AM",
    location: "Stavros Niarchos Foundation Library",
    format: "In person",
    link: null,
  },
  {
    id: "preview-3",
    class_name: "Poetry Writing Circle",
    archetype: "Learners",
    description: "Join fellow writers for a guided poetry workshop with prompts and peer feedback.",
    date: "March 12, 2026",
    time: "6:00 PM",
    location: "Schomburg Center",
    format: "In person",
    link: null,
  },
]

/* ── FAQ data ────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: "What is Library Scout?",
    a: "Library Scout is a free, open source tool that helps you discover, save, and manage public library classes and programs in NYC. We curate hundreds of classes so you never miss one that matches your interests.",
  },
  {
    q: "Is Library Scout free to use?",
    a: "Yes, completely free! Library Scout is a community project. The classes listed are free public library programs offered by NYPL and other library systems.",
  },
  {
    q: "How often is the class catalogue updated?",
    a: "We update the catalogue regularly to reflect new classes and program changes. If you notice something outdated, you can recommend an update using the button at the bottom of the page.",
  },
  {
    q: "Do I need an account to browse classes?",
    a: "No! You can browse and search the full catalogue without an account. Creating a free account lets you save classes to a personal list and leave feedback to help other community members.",
  },
]

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<LibraryClass[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [previewClasses, setPreviewClasses] = useState(FALLBACK_CLASSES)
  const [stats, setStats] = useState<{ students: number; classesAttended: number } | null>(null)

  // Fetch stats (students and classes attended)
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats")
        if (res.ok) {
          const data = await res.json()
          setStats({ students: data.students, classesAttended: data.classesAttended })
        }
      } catch {
        // Silently fail
      }
    }
    fetchStats()
  }, [])

  // Fetch 1 craft, 1 sound/audio production, 1 writing class from Supabase
  useEffect(() => {
    async function fetchPreview() {
      try {
        const supabase = createClient()

        async function fetchOne(keyword: string) {
          const { data } = await supabase
            .from("classes")
            .select("id, class_name, archetype, description, date, time, location, format, link")
            .not("description", "is", null)
            .ilike("sub_category", `%${keyword}%`)
            .order("save_count", { ascending: false })
            .limit(5)
          if (data && data.length > 0) {
            return data.sort(
              (a, b) => (b.description?.length || 0) - (a.description?.length || 0)
            )[0]
          }
          return null
        }

        const [craft, sound, writing] = await Promise.all([
          fetchOne("craft"),
          fetchOne("sound"),
          fetchOne("writing"),
        ])

        const results = [craft, sound, writing].filter(Boolean)
        if (results.length === 3) {
          setPreviewClasses(
            results.map((c) => ({
              id: String(c!.id),
              class_name: c!.class_name,
              archetype: c!.archetype || null,
              description: c!.description || "",
              date: c!.date || null,
              time: c!.time || null,
              location: c!.location || null,
              format: c!.format || null,
              link: c!.link || null,
            }))
          )
        }
      } catch {
        // Keep fallback
      }
    }
    fetchPreview()
  }, [])

  // Debounced search against full DB
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const supabase = createClient()
      const q = `%${searchQuery.trim()}%`
      const { data } = await supabase
        .from("classes")
        .select("*")
        .or(
          `class_name.ilike.${q},description.ilike.${q},main_category.ilike.${q},sub_category.ilike.${q}`
        )
        .limit(8)
      setSearchResults(data || [])
      setShowDropdown(true)
      setSearching(false)
    }, 300)
  }, [searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden xs:inline text-lg font-bold tracking-tight text-foreground font-serif whitespace-nowrap">
              library scout
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-up" className="hidden sm:block">
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent text-sm"
              >
                Create Account
              </Button>
            </Link>
            <Link href="/classes">
              <Button
                size="sm"
                className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              >
                <Search className="h-3.5 w-3.5" />
                Discover Classes
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Community Stats Banner ─────────────────── */}
      {stats !== null && (
        <div className="w-full bg-primary/5 border-b border-primary/10">
          <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 sm:gap-3 px-3 py-1.5">
            <span className="text-xs sm:text-sm text-foreground whitespace-nowrap">
              <span className="font-bold text-primary">{stats.students.toLocaleString()}</span>{" "}
              <span className="text-muted-foreground">students</span>
            </span>
            <span className="text-border">|</span>
            <span className="text-xs sm:text-sm text-foreground whitespace-nowrap">
              <span className="font-bold text-primary">{stats.classesAttended.toLocaleString()}</span>{" "}
              <span className="text-muted-foreground">classes attended</span>
            </span>
            <span className="text-muted-foreground text-xs hidden lg:inline whitespace-nowrap">
              — Goal: <span className="font-semibold text-foreground">100K</span> students!
            </span>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-0 pt-6 md:pb-0 md:pt-10">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-4 lg:gap-6">
          {/* Left column */}
          <div className="relative flex flex-1 flex-col items-start">
            {/* Mobile: library card floated top-right near NYC */}
            <div className="pointer-events-none absolute -right-2 -top-4 z-0 w-48 rotate-12 md:hidden">
              <Image
                src="/images/nypl-card.png"
                alt="NYPL library card"
                width={300}
                height={195}
                loading="eager"
                className="h-auto w-full object-contain drop-shadow-md"
              />
            </div>

            <div className="relative z-10 mb-4 flex items-center gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-foreground font-serif md:text-3xl">
                NYC
              </span>
              <span className="text-xl md:text-2xl" aria-hidden="true">✨</span>
            </div>
            <h1 
              className="relative z-10 mb-5 text-3xl font-bold leading-tight text-foreground font-serif text-balance md:text-4xl lg:text-5xl"
              style={{
                WebkitTextStroke: '3px hsl(var(--background))',
                paintOrder: 'stroke fill',
              }}
            >
              Discover classes at your local library
            </h1>
            <p className="relative z-10 mb-6 text-base leading-relaxed text-muted-foreground text-pretty md:max-w-lg">
              Library Scout helps you find, save, and manage public library programs tailored to your interests. Never miss a great class again.
            </p>

            {/* Search bar -- hidden on mobile/tablet, shown only on desktop */}
            <div ref={searchRef} className="relative z-20 hidden w-full max-w-md lg:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for a class, topic, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() =>
                    searchResults.length > 0 && setShowDropdown(true)
                  }
                  className="h-12 rounded-xl bg-background pl-11 pr-10 text-base shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setSearchResults([])
                      setShowDropdown(false)
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {showDropdown && (
                <div className="absolute inset-x-0 top-full z-[100] mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl ring-1 ring-black/5" style={{ backgroundColor: "hsl(var(--card))" }}>
                  {searching ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No classes found for &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                        {searchResults.length} result
                        {searchResults.length !== 1 ? "s" : ""}
                      </div>
                      {searchResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setShowDropdown(false)
                            router.push(
                              `/classes?search=${encodeURIComponent(c.class_name)}`
                            )
                          }}
                          className="flex w-full flex-col gap-1 border-t border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            {c.is_hot && (
                              <Flame className="h-3 w-3 shrink-0 text-[hsl(0,84%,60%)]" />
                            )}
                            <span className="text-sm font-medium text-foreground line-clamp-1">
                              {c.class_name}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {c.main_category && <span>{c.main_category}</span>}
                            {c.location && c.location !== "Unknown" && (
                              <>
                                <span className="text-border">|</span>
                                <span>{c.location}</span>
                              </>
                            )}
                          </div>
                        </button>
                      ))}
                      <Link
                        href={`/classes?search=${encodeURIComponent(searchQuery)}`}
                        className="flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/50"
                      >
                        View all results
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column -- NYPL hero image (desktop only) */}
          <div className="hidden flex-1 items-center justify-center md:flex md:flex-[1.2]">
            <div className="relative w-full max-w-lg">
              <Image
                src="/images/nypl-hero.png"
                alt="New York Public Library building with NYPL library card"
                width={600}
                height={720}
                className="h-auto w-full object-contain drop-shadow-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── A taste of what's happening ──────────────────── */}
      <section className="bg-background px-4 pt-0 pb-6 md:pt-0 md:pb-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Image
              src="/images/magnifying-glass.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              aria-hidden="true"
            />
            <h2 className="text-center text-2xl font-bold font-serif text-foreground">
              A taste of what{"'"}s happening
            </h2>
          </div>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Here{"'"}s a preview of classes in the catalogue right now.
          </p>

          {/* Horizontal scroll on mobile/tablet, grid on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 snap-x snap-mandatory">
            {previewClasses.map((c) => {
              const style = getArchetypeStyle(c.archetype)
              const ArchIcon = style.icon

              return (
                <Card
                  key={c.id}
                  className="relative shrink-0 overflow-hidden border border-border bg-card transition-shadow hover:shadow-md snap-start w-[280px] sm:w-[320px] lg:w-auto"
                >
                  {/* Archetype gradient overlay -- top-left radial fade */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `radial-gradient(ellipse at top left, ${style.gradientColor} 0%, transparent 70%)`,
                      opacity: 0.5,
                    }}
                  />

                  <CardContent className="relative z-10 flex flex-col gap-3 p-0">
                    {/* Tags row + bookmark top-right */}
                    <div className="flex items-start justify-between gap-2 px-5 pt-5">
                      <div className="flex flex-wrap items-center gap-2">
                        {c.archetype && (
                          <Badge
                            className="text-xs font-medium gap-1 border-transparent"
                            style={{ backgroundColor: style.badgeBg, color: style.badgeText }}
                          >
                            <ArchIcon className="h-3 w-3" />
                            {c.archetype}
                          </Badge>
                        )}
                        {c.format && (
                          <Badge variant="outline" className="text-xs">
                            {c.format}
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push("/auth")
                        }}
                        className="shrink-0 text-muted-foreground/50 transition-colors hover:text-foreground"
                        aria-label="Sign in to save"
                      >
                        <Bookmark className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Title + description */}
                    <div className="px-5">
                      <h3 className="text-base font-bold leading-tight text-foreground line-clamp-2">
                        {c.class_name}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {c.description}
                      </p>
                    </div>

                    {/* Date/time + location */}
                    <div className="flex flex-col gap-1.5 px-5 text-xs">
                      {(c.date || c.time) && (
                        <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {c.date}{c.date && c.time ? " \u00B7 " : ""}{c.time}
                          </span>
                        </div>
                      )}
                      {c.location && c.location !== "Unknown" && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-1">{c.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center gap-0 border-t border-border">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push("/auth")
                        }}
                        className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <CalendarDays className="h-3.5 w-3.5" />
                        Calendar
                      </button>
                      <div className="h-5 w-px bg-border" />
                      <a
                        href={c.link || "https://www.nypl.org/events/classes"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        NYPL
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col xs:flex-row items-center justify-center gap-3 w-full px-4">
            <Link href="/classes" className="w-full xs:w-auto">
              <Button
                size="lg"
                className="w-full xs:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Browse All Classes
              </Button>
            </Link>
            <Link href="/auth/sign-up" className="w-full xs:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full xs:w-auto gap-2 bg-transparent"
              >
                Create Account
              </Button>
            </Link>
          </div>

          {/* Attribution */}
          <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground italic">
            *this list is lovingly curated + built by{" "}
            <a
              href="https://www.tiktok.com/@batinspace"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              @batinspace
            </a>{" "}
            (tiktok){" "}
            <a
              href="https://www.instagram.com/ciao4now/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              @ciao4now
            </a>{" "}
            (insta)
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="border-t border-border bg-card px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold font-serif text-foreground">
            How it works
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                image: "/images/compass.png",
                title: "Discover",
                desc: "Browse hundreds of free library classes filtered by your interests, time, and location.",
              },
              {
                image: "/images/folder.png",
                title: "Save",
                desc: "Build your personal list of classes you want to attend and never lose track.",
              },
              {
                image: "/images/megaphone.png",
                title: "Rate",
                desc: "Leave feedback on classes you've attended to help others find great programs.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center gap-3 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-contain"
                  />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="border-t border-border bg-background px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold font-serif text-foreground">
            FAQ
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <Minus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-border px-5 pb-4 pt-3">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border bg-card px-4 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfMRQUnHZOPJKwJDQCAg3P3Iz2pls4o7dX4eXuPxA-vRlfBoA/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent text-xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Recommend an update
            </Button>
          </a>
          <p className="text-xs text-muted-foreground">
            Library Scout &mdash; Built with care for the community.
          </p>
        </div>
      </footer>
    </div>
  )
}
