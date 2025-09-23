import React from 'react';

// FIX: Changed IconProps to use React.ComponentProps<'svg'> for robust and correct prop typing.
type IconProps = React.ComponentProps<'svg'>;

export default function SailboatIcon(props: IconProps): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 18.5l-1-1.5M18 17l-1-1.5M2 17l10 2.5V3.5L2 17zm0 0l10 2.5V17m-10 0h10" />
    </svg>
  );
}