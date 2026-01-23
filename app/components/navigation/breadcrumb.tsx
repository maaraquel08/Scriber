"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        
        return (
          <div key={index} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground font-medium" : ""}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </div>
        )
      })}
    </nav>
  )
}
