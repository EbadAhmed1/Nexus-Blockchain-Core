import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50"

    const variantStyles = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-lg shadow-primary/20",
      destructive: "bg-destructive text-white hover:bg-destructive/90",
      outline: "border border-[#3A0000] bg-[#1A0000] hover:bg-[#2A0000] hover:border-primary/50 hover:text-primary",
      secondary: "bg-[#2A0000] text-foreground hover:bg-[#3A0000] border border-[#3A0000]",
      ghost: "hover:bg-[#2A0000] hover:text-primary",
      link: "text-primary underline-offset-4 hover:underline",
    }

    const sizeStyles = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3",
      lg: "h-10 rounded-md px-6",
      icon: "size-9",
    }

    return (
      <button
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ""}`}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }
