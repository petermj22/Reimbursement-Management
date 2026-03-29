import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <motion.div
        animate={error ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full relative group"
      >
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300",
            error ? "border-red-500 focus-visible:ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-input hover:border-indigo-400 focus-visible:border-indigo-500",
            className,
          )}
          ref={ref}
          {...props}
        />
        {/* Subtle glow effect behind the input on focus */}
        <div className="absolute inset-0 -z-10 bg-indigo-500/0 group-focus-within:bg-indigo-500/10 blur-xl transition-all duration-500 rounded-md" />
      </motion.div>
    );
  },
);
Input.displayName = "Input";

export { Input };
