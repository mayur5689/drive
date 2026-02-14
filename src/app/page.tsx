import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-purple-500/30 font-sans overflow-x-hidden">
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse [animation-delay:1s]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg flex items-center justify-center font-bold text-lg">A</div>
          <span className="text-xl font-bold tracking-tight">AneeRequest</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Resources</a>
          <button className="px-5 py-2 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition-all active:scale-95">
            Get Started
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-400 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
          Beta version 2.0 is now live
        </div>
        
        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-slide-up">
          Streamline Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Collaborations.</span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-zinc-400 mb-12 animate-slide-up [animation-delay:0.1s]">
          AneeRequest simplifies how you manage requests and collaborative workflows. 
          Built for modern teams who value speed, beauty, and precision.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up [animation-delay:0.2s]">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all active:scale-95">
            Start Requesting Free
          </button>
          <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all active:scale-95 backdrop-blur-sm">
            Watch Demo
          </button>
        </div>

        {/* Mockup / Visual Area */}
        <div className="mt-20 w-full max-w-5xl aspect-video rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl relative overflow-hidden group animate-slide-up [animation-delay:0.3s]">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#030303]/80 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-8 bg-white/5 flex items-center gap-1.5 px-4">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
          <div className="p-12 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="h-4 w-40 bg-white/10 rounded-full" />
              <div className="h-4 w-20 bg-white/10 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-white/5 rounded-2xl border border-white/5 p-6 flex flex-col justify-end gap-3 group-hover:border-purple-500/30 transition-colors">
                  <div className="h-3 w-1/2 bg-white/10 rounded-full" />
                  <div className="h-3 w-3/4 bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-white/5 text-center text-zinc-500 text-sm">
        <p>&copy; 2024 AneeRequest. Crafted with precision for AneeVerse.</p>
      </footer>
    </div>
  );
}
