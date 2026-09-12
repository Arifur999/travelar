import Loader from "./Loader";

interface RouteLoadingProps {
  label?: string;
}

/**
 * What every `loading.tsx` returns. Centred in the route slot rather than the
 * viewport, so it appears inside the dashboard shell instead of replacing it.
 */
const RouteLoading = ({ label = "Loading..." }: RouteLoadingProps) => (
  <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3">
    <Loader size={36} label={label} />
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export default RouteLoading;
