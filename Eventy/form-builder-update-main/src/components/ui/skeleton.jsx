
import { cn } from "@/lib/utils"

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {React.HTMLAttributes<HTMLDivElement>} [props.rest]
 */
function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
