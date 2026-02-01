import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const GlassPanel = forwardRef(
  (
    {
      children,
      className = '',
      variant = 'default',
      size = 'md',
      animated = true,
      hover = false,
      corners,
      glow,
      onClick,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: 'bg-card-bg border-border',
      ember: 'bg-card-bg border-border',
      accent: 'bg-card-bg border-primary/20',
      warning: 'bg-warning-light border-warning/20',
      critical: 'bg-danger-light border-danger/20',
      success: 'bg-success-light border-success/20',
      orange: 'bg-gradient-to-br from-accent-bg to-orange-500 border-transparent text-white',
      minimal: 'bg-surface border-border-light',
    };

    const sizeStyles = {
      sm: 'p-4 rounded-2xl',
      md: 'p-5 rounded-2xl',
      lg: 'p-6 rounded-3xl',
    };

    const hoverStyles = hover ? 'hover:shadow-md' : '';

    const motionProps = animated
      ? {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
        }
      : {};

    const combinedClassName = `
      relative border transition-all duration-200 shadow-sm
      ${variantStyles[variant] || variantStyles.default}
      ${sizeStyles[size]}
      ${hoverStyles}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `;

    if (animated) {
      return (
        <motion.div ref={ref} className={combinedClassName} onClick={onClick} {...motionProps}>
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={combinedClassName} onClick={onClick} {...props}>
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

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
    <GlassPanel variant={variant} className={className} {...props}>
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-primary-lighter flex items-center justify-center text-primary">
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && (
                <h3 className="font-display font-semibold text-text-primary text-[17px]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </GlassPanel>
  );
}

export function GlassDivider({ className = '' }) {
  return <div className={`h-px bg-border my-4 ${className}`} />;
}

export default GlassPanel;
