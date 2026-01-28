import { motion } from 'framer-motion';
import { forwardRef } from 'react';

/**
 * GlassPanel - Smoked Glass with Ember Tint
 *
 * "Magma & Obsidian" aesthetic:
 * - Dark smoked glass background
 * - Amber/orange tinted borders
 * - Inner glow effects mimicking heated metal
 * - No standard shadows - only glows
 */
const GlassPanel = forwardRef(
  (
    {
      children,
      className = '',
      variant = 'default', // 'default' | 'ember' | 'critical' | 'warning' | 'minimal'
      size = 'md', // 'sm' | 'md' | 'lg'
      glow = false,
      animated = true,
      corners = false,
      hover = true,
      onClick,
      ...props
    },
    ref
  ) => {
    // Base styles - Smoked glass effect
    const baseStyles = `
      relative
      backdrop-blur-xl
      border
      transition-all
      duration-300
      overflow-hidden
    `;

    // Variant-specific styles - Ember/Magma theme
    const variantStyles = {
      default: `
        bg-black/60
        border-burnt-orange/20
        shadow-[0_0_15px_rgba(255,140,0,0.08)]
        shadow-[inset_0_1px_0_rgba(255,140,0,0.1)]
      `,
      ember: `
        bg-black/70
        border-burnt-orange/30
        shadow-[0_0_20px_rgba(255,69,0,0.15)]
        shadow-[inset_0_0_30px_rgba(255,69,0,0.05)]
      `,
      critical: `
        bg-black/80
        border-strobe-red/50
        shadow-[0_0_30px_rgba(255,0,0,0.25)]
        shadow-[inset_0_0_40px_rgba(255,0,0,0.1)]
      `,
      warning: `
        bg-black/70
        border-warning-yellow/40
        shadow-[0_0_20px_rgba(255,186,8,0.15)]
        shadow-[inset_0_0_20px_rgba(255,186,8,0.05)]
      `,
      minimal: `
        bg-black/40
        border-tungsten/30
      `,
    };

    // Size-specific padding
    const sizeStyles = {
      sm: 'p-3 rounded-lg',
      md: 'p-4 rounded-xl',
      lg: 'p-6 rounded-2xl',
    };

    // Hover effect styles
    const hoverStyles = hover
      ? `
        hover:border-burnt-orange/40
        hover:shadow-[0_0_25px_rgba(255,69,0,0.2)]
      `
      : '';

    // Glow effect for active/selected states
    const glowStyles = glow
      ? `
        before:absolute
        before:inset-0
        before:rounded-inherit
        before:bg-gradient-to-r
        before:from-burnt-orange/0
        before:via-burnt-orange/10
        before:to-burnt-orange/0
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

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${hoverStyles}
      ${glowStyles}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `;

    // Motion props only for animated components
    const motionProps = animated
      ? {
          variants: motionVariants,
          initial: 'initial',
          animate: 'animate',
          whileHover: hover ? 'hover' : undefined,
          whileTap: onClick ? 'tap' : undefined,
        }
      : {};

    // Shared inner content
    const innerContent = (
      <>
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
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

        {/* Top edge highlight - heated metal effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-burnt-orange/30 to-transparent" />

        {/* Bottom subtle glow */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-deep-amber/10 to-transparent" />
      </>
    );

    if (animated) {
      return (
        <motion.div
          ref={ref}
          className={combinedClassName}
          onClick={onClick}
          {...motionProps}
        >
          {innerContent}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={combinedClassName} onClick={onClick} {...props}>
        {innerContent}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

/**
 * Corner decoration component - Ember style
 */
function Corner({ position, variant }) {
  const colorClass = {
    default: 'border-burnt-orange/40',
    ember: 'border-deep-amber/50',
    critical: 'border-strobe-red/60',
    warning: 'border-warning-yellow/50',
    minimal: 'border-tungsten/30',
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
 * GlassCard - Specialized panel with header - Ember theme
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
              <div className="p-2 rounded-lg bg-burnt-orange/10 text-burnt-orange">
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && (
                <h3 className="font-rajdhani font-semibold text-off-white text-lg">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-dim-grey font-inter">{subtitle}</p>
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
 * GlassDivider - Subtle divider with ember glow
 */
export function GlassDivider({ className = '' }) {
  return (
    <div
      className={`
        h-px
        bg-gradient-to-r
        from-transparent
        via-burnt-orange/20
        to-transparent
        my-4
        ${className}
      `}
    />
  );
}

export default GlassPanel;
