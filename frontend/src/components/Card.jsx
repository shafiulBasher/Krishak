<<<<<<< HEAD
export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
      onClick={onClick}
      {...props}
    >
=======
export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
>>>>>>> b4da24f (New import of project files)
      {children}
    </div>
  );
}

export { Card };
