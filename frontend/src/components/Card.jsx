export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card };
