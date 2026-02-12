export const EveAiIcon = ({
  className = "h-6 w-6",
  strokeWidth,
  ...props
}: React.SVGProps<SVGSVGElement> & {
  strokeWidth?: number;
}) => {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path
        fill="url(#a-nav-logo)"
        fillRule="evenodd"
        d="M14.451.981a5 5 0 0 0-4.902 0l-6 3.375A5 5 0 0 0 1 8.714v6.572a5 5 0 0 0 2.549 4.357l6 3.375a5 5 0 0 0 4.902 0l6-3.375A5 5 0 0 0 23 15.287V8.714a5 5 0 0 0-2.549-4.358l-6-3.375ZM10.53 2.725a3 3 0 0 1 2.942 0l1.102.62-2.45 1.401-2.572-1.47.978-.551ZM5.864 5.349l-1.335.75A3 3 0 0 0 3 8.715v1.314l2.852-1.661.012-3.018ZM3 13.946v1.34A3 3 0 0 0 4.53 17.9l1.334.751-.012-3.043L3 13.946Zm6.528 6.766 1.001.563a3 3 0 0 0 2.942 0l1.124-.632-2.473-1.415-2.594 1.484Zm8.854-2.2 1.089-.612A3 3 0 0 0 21 15.286v-1.197l-2.607 1.519-.011 2.905ZM21 9.887V8.714A3 3 0 0 0 19.47 6.1l-1.088-.613.011 2.88L21 9.886Zm-4.622-5.27.015 3.759a2 2 0 0 0 .993 1.72l3.248 1.892-3.248 1.893a2 2 0 0 0-.993 1.72l-.015 3.758-3.262-1.866a2 2 0 0 0-1.987 0l-3.262 1.866-.015-3.758a2 2 0 0 0-.993-1.72L3.61 11.987l3.248-1.892a2 2 0 0 0 .993-1.72l.015-3.76 3.262 1.867a2 2 0 0 0 1.987 0l3.262-1.866Z"
        clipRule="evenodd"
      />
      <defs>
        <radialGradient
          id="a-nav-logo"
          cx="0"
          cy="0"
          r="1"
          gradientTransform="matrix(-11 0 0 -11.6606 12 12)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1B68E4" />
          <stop offset="1" stopColor="#8A87EF" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default EveAiIcon;
