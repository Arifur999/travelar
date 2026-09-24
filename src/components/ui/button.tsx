import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // The brand gradient (globals.css), not a flat fill, and the same one
        // in both themes — so the label is plain white rather than
        // --primary-foreground, which flips to deep blue on a dark ground.
        // .btn-primary adds the white bezel, the glow and the icon disc.
        default: "btn-primary bg-gradient-primary text-white",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        // primary-strong, not primary: a link is text, and #207BF3 on a light
        // ground is 4.05:1.
        link: "text-primary-strong underline-offset-4 hover:underline",
      },
      // One step up from shadcn's defaults: the old 36px button read as small
      // next to the cards around it, and 44px is also the touch target a phone
      // wants. xs stays where it is — it is for a chip inside a table row.
      size: {
        // data-icon is set below, and only on a primary button that has one:
        // it says which end the disc is on so the pill can close up around it.
        default:
          "h-11 px-6 py-2 text-[0.9375rem] data-[icon]:gap-3 data-[icon=leading]:pl-1.5 data-[icon=trailing]:pr-1.5 data-[icon=both]:px-1.5",
        xs: "h-6 gap-1 px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 data-[icon=leading]:pl-1 data-[icon=trailing]:pr-1 data-[icon=both]:px-1",
        lg: "h-12 px-8 text-base data-[icon]:gap-3 data-[icon=leading]:pl-2 data-[icon=trailing]:pr-2 data-[icon=both]:px-2",
        icon: "size-11",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Sizes whose primary button dresses its icon as a white disc (globals.css).
// An icon-only button is already a disc, and xs is a chip in a table row.
const DISC_SIZES = new Set(["default", "sm", "lg"])

/**
 * Which end the icon is on, so the pill can close up around its disc.
 *
 * CSS cannot work this out on its own: the label is a bare text node, so a
 * lone <svg> is both :first-child and :last-child and a trailing icon looks
 * exactly like a leading one. React can see the text, so it decides here.
 */
const iconEdge = (children: React.ReactNode) => {
  const top = React.Children.toArray(children)
  // asChild renders through a single element — a Link, usually — and the icon
  // is that element's child rather than the button's.
  const kids =
    top.length === 1 && React.isValidElement(top[0])
      ? React.Children.toArray((top[0].props as { children?: React.ReactNode }).children)
      : top
  if (kids.length < 2) return undefined

  const leading = React.isValidElement(kids[0])
  const trailing = React.isValidElement(kids[kids.length - 1])
  if (leading && trailing) return "both"
  if (leading) return "leading"
  if (trailing) return "trailing"
  return undefined
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const icon =
    variant === "default" && DISC_SIZES.has(size ?? "default") ? iconEdge(children) : undefined

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-icon={icon}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
