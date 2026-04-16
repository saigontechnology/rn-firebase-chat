import React from 'react';

export interface ButtonMaterialIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  size?: number;
  rounded?: number;
  className?: string;
  background?: string;
  style?: React.CSSProperties;
}

export const ButtonMaterialIcon = React.forwardRef<
  HTMLButtonElement,
  ButtonMaterialIconProps
>(
  (
    {
      icon,
      size = 20,
      rounded = 8,
      className = '',
      background = 'var(--btn-bg, #eef2f7)',
      style,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={(rest as any).type || 'button'}
        {...rest}
        className={`icon-material-btn ${className}`}
        style={{
          width: size + 16,
          height: size + 16,
          borderRadius: rounded,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background,
          cursor: rest.disabled ? 'not-allowed' : 'pointer',
          opacity: rest.disabled ? 0.6 : 1,
          ...style,
        }}
      >
        <span className="material-icons" style={{ fontSize: size }}>
          {icon}
        </span>
      </button>
    );
  }
);

ButtonMaterialIcon.displayName = 'ButtonMaterialIcon';

export default ButtonMaterialIcon;
