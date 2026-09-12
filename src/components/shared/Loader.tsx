import { cn } from "@/lib/utils";

interface LoaderProps {
  /** Pixel size. Drives the CSS custom property, so one element covers every size. */
  size?: number;
  /** Use on a primary-coloured ground, where the default border would vanish. */
  onDark?: boolean;
  /** Announced to screen readers; the spinner itself is decorative. */
  label?: string;
  className?: string;
}

const Loader = ({ size = 32, onDark = false, label, className }: LoaderProps) => (
  <span
    className={cn("app-loader", onDark && "app-loader--on-dark", className)}
    style={{ ["--loader-size" as string]: `${size}px` }}
    role="status"
  >
    <span className="sr-only">{label ?? "Loading"}</span>
  </span>
);

export default Loader;
