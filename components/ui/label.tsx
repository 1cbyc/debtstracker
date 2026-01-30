import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Radix Label primitive is usually used, but we can stick to native label with badging styles.
// However, shadcn usually imports @radix-ui/react-label.
// I will wrap a simple label element to avoid install, or install it.
// I'll stick to native label but styled.
// Wait, libraries often expect the ref to be the element.

const labelVariants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(labelVariants(), className)}
        {...props}
    />
))
Label.displayName = "Label"

export { Label }
