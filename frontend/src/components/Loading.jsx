import { Loader2 } from 'lucide-react';

export default function Loading({ fullScreen = false, size = 'default', message = '' }) {
  const sizes = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-50">
        <Loader2 className={`${sizes[size]} animate-spin text-primary-600`} />
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className={`${sizes[size]} animate-spin text-primary-600`} />
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
}

export { Loading };
