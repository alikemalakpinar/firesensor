import { motion } from 'framer-motion';
import { forwardRef } from 'react';

/**
 * GlassPanel - A reusable glassmorphism panel component
 *
 * Implements the "Glassmorphism 3.0" design with:
 * - High background blur
 * - Thin 1px semi-transparent borders
 * - Subtle noise texture overlay
 * - Corner accent decorations
 * - Glow effects on hover/active states
 */
const GlassPanel = forwardRef(
  (
    {
      children,
      className = '',
      variant = 'default', // 'default' | 'accent' | 'critical' | 'warning' | 'minimal'
      size = 'md', // 'sm' | 'md' | 'lg'
      glow = false,
      animated = true,
      corners = false, // Show corner accent decorations
      hover = true,
      onClick,
      ...props
    },
    ref
  ) => {
    // Base styles for the glass effect
    const baseStyles = `
      relative
      backdrop-blur-xl
      border
      transition-all
      duration-300
      overflow-hidden
    `;

    // Variant-specific styles
    const variantStyles = {
      default: `
        bg-void-black/40
        border-white/10
        shadow-lg
        shadow-deep-teal/5
      `,
      accent: `
        bg-deep-teal/20
        border-electric-cyan/30
        shadow-lg
        shadow-electric-cyan/10
      `,
      critical: `
        bg-neon-red/10
        border-neon-red/40
        shadow-lg
        shadow-neon-red/20
      `,
      warning: `
        bg-amber/10
        border-amber/40
        shadow-lg
        shadow-amber/20
      `,
      minimal: `
        bg-transparent
        border-white/5
      `,
    };

    // Size-specific padding
    const sizeStyles = {
      sm: 'p-2 rounded-lg',
      md: 'p-4 rounded-xl',
      lg: 'p-6 rounded-2xl',
    };

    // Hover effect styles
    const hoverStyles = hover
      ? `
        hover:bg-white/5
        hover:border-white/20
        hover:shadow-xl
      `
      : '';

    // Glow effect
    const glowStyles = glow
      ? `
        before:absolute
        before:inset-0
        before:rounded-inherit
        before:bg-gradient-to-r
        before:from-electric-cyan/0
        before:via-electric-cyan/5
        before:to-electric-cyan/0
        before:animate-pulse
      `
      : '';

    // Animation variants for framer-motion
    const motionVariants = {
      initial: animated ? { opacity: 0, y: 20, scale: 0.95 } : {},
      animate: animated
        ? {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            },
          }
        : {},
      hover: hover
        ? {
            scale: 1.02,
            transition: { duration: 0.2 },
          }
        : {},
      tap: onClick
        ? {
            scale: 0.98,
            transition: { duration: 0.1 },
          }
        : {},
    };

    const Component = animated ? motion.div : 'div';

    return (
      <Component
        ref={ref}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${hoverStyles}
          ${glowStyles}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
        onClick={onClick}
        variants={motionVariants}
        initial="initial"
        animate="animate"
        whileHover={hover ? 'hover' : undefined}
        whileTap={onClick ? 'tap' : undefined}
        {...props}
      >
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Corner decorations */}
        {corners && (
          <>
            <Corner position="top-left" variant={variant} />
            <Corner position="top-right" variant={variant} />
            <Corner position="bottom-left" variant={variant} />
            <Corner position="bottom-right" variant={variant} />
          </>
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Gradient overlay at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </Component>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

/**
 * Corner decoration component
 */
function Corner({ position, variant }) {
  const colorClass = {
    default: 'border-white/30',
    accent: 'border-electric-cyan/50',
    critical: 'border-neon-red/50',
    warning: 'border-amber/50',
    minimal: 'border-white/10',
  }[variant];

  const positionClasses = {
    'top-left': 'top-0 left-0 border-t border-l rounded-tl-xl',
    'top-right': 'top-0 right-0 border-t border-r rounded-tr-xl',
    'bottom-left': 'bottom-0 left-0 border-b border-l rounded-bl-xl',
    'bottom-right': 'bottom-0 right-0 border-b border-r rounded-br-xl',
  }[position];

  return (
    <div
      className={`
        absolute
        w-4
        h-4
        ${positionClasses}
        ${colorClass}
        pointer-events-none
      `}
    />
  );
}

/**
 * GlassCard - A specialized glass panel with header and content sections
 */
export function GlassCard({
  title,
  subtitle,
  icon: Icon,
  children,
  headerRight,
  variant = 'default',
  className = '',
  ...props
}) {
  return (
    <GlassPanel variant={variant} corners className={className} {...props}>
      {/* Header */}
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-electric-cyan/10 text-electric-cyan">
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && (
                <h3 className="font-rajdhani font-semibold text-white text-lg">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-white/50 font-inter">{subtitle}</p>
              )}
            </div>
          </div>
          {headerRight}
        </div>
      )}

      {/* Content */}
      {children}
    </GlassPanel>
  );
}

/**
 * GlassDivider - A subtle divider for use within glass panels
 */
export function GlassDivider({ className = '' }) {
  return (
    <div
      className={`
        h-px
        bg-gradient-to-r
        from-transparent
        via-white/10
        to-transparent
        my-4
        ${className}
      `}
    />
  );
}

export default GlassPanel;
