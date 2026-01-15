import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80",
                secondary:
                    "border-transparent bg-zinc-800 text-zinc-100 hover:bg-zinc-800/80",
                destructive:
                    "border-transparent bg-red-900/50 text-red-200 hover:bg-red-900/60",
                success:
                    "border-transparent bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/50",
                warning:
                    "border-transparent bg-amber-900/40 text-amber-200 hover:bg-amber-900/50",
                outline: "text-zinc-100 border-zinc-700",
                ghost: "bg-transparent text-zinc-100 hover:bg-zinc-800/10 border-transparent",
            },
            size: {
                sm: "text-[10px] px-2 py-[1px]",
                md: "text-xs px-2.5 py-0.5"
            }
        },
        defaultVariants: {
            variant: "default",
            size: "md"
        },
    }
);

interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
