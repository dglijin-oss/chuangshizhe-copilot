// Full-page loading screen
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream animate-fade-in">
      {/* Pulsing ring */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full border-2 border-brown/20" style={{ animation: 'pulseRing 2s ease-in-out infinite' }} />
        <div className="w-16 h-16 rounded-full bg-brown flex items-center justify-center shadow-lg">
          <span className="text-white font-serif text-xl font-bold">创</span>
        </div>
      </div>
      <p className="text-text-muted text-sm tracking-[0.2em]">创世者 Copilot</p>
    </div>
  );
}

// Skeleton loader for card-like content
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl animate-shimmer ${className}`} />;
}

// Compact inline loader (for buttons/small areas)
export function InlineLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return (
    <div className={`rounded-full border-2 border-brown/30 border-t-brown ${dims[size]}`}
      style={{ animation: 'spin 0.8s linear infinite' }} />
  );
}
