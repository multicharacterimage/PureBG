import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Download, 
  X, 
  Loader2, 
  History, 
  Sun, 
  Moon, 
  Check, 
  Layers,
  Palette,
  ArrowRight,
  Github,
  Info,
  Plus
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import { cn } from './lib/utils';

// --- Types ---
interface ProcessedImage {
  id: string;
  originalUrl: string;
  processedUrl: string;
  timestamp: number;
}

// --- Components ---

const Navbar = ({ darkMode, toggleDarkMode }: { darkMode: boolean; toggleDarkMode: () => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
          <Layers size={18} />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">PureBG</span>
      </div>
      
      <div className="hidden items-center gap-8 md:flex">
        <a href="#" className="text-sm font-medium text-white/70 transition-colors hover:text-white">Home</a>
        <a href="#" className="text-sm font-medium text-white/70 transition-colors hover:text-white">About</a>
        <a href="#" className="text-sm font-medium text-white/70 transition-colors hover:text-white">Contact</a>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition-all hover:bg-white/5 hover:text-white"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="hidden rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95 sm:block">
          Get Started
        </button>
      </div>
    </div>
  </nav>
);

const ComparisonSlider = ({ original, processed }: { original: string; processed: string }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 md:aspect-video"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      {/* Original */}
      <img 
        src={original} 
        alt="Original" 
        className="absolute inset-0 h-full w-full object-contain"
        referrerPolicy="no-referrer"
      />
      
      {/* Processed */}
      <div 
        className="absolute inset-0 h-full overflow-hidden border-r-2 border-white"
        style={{ width: `${sliderPosition}%` }}
      >
        <div className="absolute inset-0 h-full w-[100vw] bg-neutral-800">
          <img 
            src={processed} 
            alt="Processed" 
            className="h-full w-full object-contain"
            style={{ width: containerRef.current?.clientWidth }}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
        After
      </div>
      <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
        Before
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 z-10 w-1 bg-white cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black shadow-xl">
          <div className="flex gap-0.5">
            <div className="h-2 w-0.5 bg-white/50" />
            <div className="h-2 w-0.5 bg-white/50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [bgColor, setBgColor] = useState('transparent');
  const [error, setError] = useState<string | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('purebg_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('purebg_history', JSON.stringify(history.slice(0, 3)));
  }, [history]);

  const processImage = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    const originalUrl = URL.createObjectURL(file);
    setOriginalImage(originalUrl);

    try {
      const blob = await removeBackground(file, {
        progress: (step, current, total) => {
          console.log(`Processing: ${step} ${current}/${total}`);
        }
      });
      
      const processedUrl = URL.createObjectURL(blob);
      setProcessedImage(processedUrl);
      
      const newEntry: ProcessedImage = {
        id: Math.random().toString(36).substr(2, 9),
        originalUrl,
        processedUrl,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newEntry, ...prev].slice(0, 3));
    } catch (err) {
      console.error(err);
      setError("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    // If we have a background color, we need to draw it on a canvas
    if (bgColor !== 'transparent') {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const link = document.createElement('a');
          link.download = 'purebg-result.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      };
      img.src = processedImage;
    } else {
      const link = document.createElement('a');
      link.download = 'purebg-result.png';
      link.href = processedImage;
      link.click();
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setBgColor('transparent');
    setError(null);
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      darkMode ? "bg-[#050505] text-white" : "bg-neutral-50 text-black"
    )}>
      <Navbar darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />

      <main className="mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        {!originalImage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 text-center"
          >
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl">
              Remove Image Background <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Instantly with AI
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-neutral-400 sm:text-xl">
              Professional-grade background removal in seconds. 100% automatic, 
              private, and runs entirely in your browser. No sign-up required.
            </p>
          </motion.div>
        )}

        <div className="mx-auto max-w-4xl">
          <AnimatePresence mode="wait">
            {!originalImage ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative"
              >
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={onDrop}
                  className={cn(
                    "group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 transition-all md:p-20",
                    darkMode ? "border-white/10 bg-white/5 hover:border-emerald-500/50" : "border-black/10 bg-black/5 hover:border-emerald-500/50"
                  )}
                >
                  <input 
                    type="file" 
                    onChange={onFileChange} 
                    accept="image/*" 
                    className="absolute inset-0 cursor-pointer opacity-0" 
                  />
                  
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-110">
                    <Upload size={40} />
                  </div>
                  
                  <h3 className="mb-2 text-2xl font-bold">Drop your image here</h3>
                  <p className="mb-8 text-neutral-400">or click to browse files</p>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-medium text-neutral-400">
                      <Check size={14} className="text-emerald-500" /> JPG, PNG, JPEG
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-medium text-neutral-400">
                      <Check size={14} className="text-emerald-500" /> Max 10MB
                    </div>
                  </div>
                </div>

                {/* History */}
                {history.length > 0 && (
                  <div className="mt-12">
                    <div className="mb-4 flex items-center gap-2 text-neutral-400">
                      <History size={16} />
                      <span className="text-sm font-semibold uppercase tracking-wider">Recent Images</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {history.map((item) => (
                        <button 
                          key={item.id}
                          onClick={() => {
                            setOriginalImage(item.originalUrl);
                            setProcessedImage(item.processedUrl);
                          }}
                          className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-transform hover:scale-105"
                        >
                          <img 
                            src={item.processedUrl} 
                            alt="History item" 
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-500/10 p-4 text-center text-red-500 border border-red-500/20">
                    {error}
                  </div>
                )}

                {/* Main View */}
                <div className="relative">
                  {isProcessing ? (
                    <div className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-neutral-900 md:aspect-video">
                      <Loader2 size={48} className="mb-4 animate-spin text-emerald-500" />
                      <p className="text-lg font-medium text-neutral-400">AI is working its magic...</p>
                      <div className="mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-white/5">
                        <motion.div 
                          className="h-full bg-emerald-500"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </div>
                  ) : processedImage ? (
                    <div className="space-y-6">
                      <div className="relative overflow-hidden rounded-2xl border border-white/10" style={{ backgroundColor: bgColor }}>
                        {bgColor === 'transparent' && (
                          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                        )}
                        <ComparisonSlider original={originalImage} processed={processedImage} />
                      </div>

                      {/* Controls */}
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <div className="mb-4 flex items-center gap-2 font-semibold">
                            <Palette size={18} className="text-emerald-500" />
                            Background Color
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {['transparent', '#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].map((color) => (
                              <button
                                key={color}
                                onClick={() => setBgColor(color)}
                                className={cn(
                                  "h-10 w-10 rounded-full border-2 transition-transform hover:scale-110",
                                  bgColor === color ? "border-emerald-500 scale-110" : "border-white/10",
                                  color === 'transparent' ? "bg-neutral-800 flex items-center justify-center" : ""
                                )}
                                style={{ backgroundColor: color !== 'transparent' ? color : undefined }}
                              >
                                {color === 'transparent' && <X size={14} className="text-white/50" />}
                              </button>
                            ))}
                            
                            {/* Custom Color Picker */}
                            <button
                              onClick={() => colorInputRef.current?.click()}
                              className={cn(
                                "h-10 w-10 rounded-full border-2 border-white/10 bg-white/5 flex items-center justify-center transition-transform hover:scale-110",
                                !['transparent', '#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].includes(bgColor) && "border-emerald-500 scale-110"
                              )}
                              style={{ 
                                backgroundColor: !['transparent', '#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].includes(bgColor) ? bgColor : undefined 
                              }}
                            >
                              <Plus size={18} className={cn(
                                !['transparent', '#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'].includes(bgColor) ? "text-white" : "text-white/50"
                              )} />
                            </button>
                            <input 
                              ref={colorInputRef}
                              type="color" 
                              className="sr-only"
                              onChange={(e) => setBgColor(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col justify-center gap-4">
                          <button 
                            onClick={downloadImage}
                            className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-500/40 active:scale-95"
                          >
                            <Download size={20} />
                            Download Result
                          </button>
                          <button 
                            onClick={reset}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 font-semibold text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <ArrowRight size={18} />
                            Upload Another
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Features Grid */}
        {!originalImage && (
          <div className="mt-32 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Layers className="text-emerald-500" />,
                title: "AI-Powered Precision",
                desc: "Our advanced neural network handles complex edges like hair and fur with incredible accuracy."
              },
              {
                icon: <Check className="text-cyan-500" />,
                title: "100% Automatic",
                desc: "No manual selection needed. Just upload and let our AI do all the heavy lifting for you."
              },
              {
                icon: <Info className="text-purple-500" />,
                title: "Privacy First",
                desc: "Processing happens entirely in your browser. Your images never leave your device."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-8"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                <p className="text-neutral-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-center gap-6">
            <a href="#" className="text-neutral-500 hover:text-white"><Github size={20} /></a>
            <a href="#" className="text-neutral-500 hover:text-white"><ImageIcon size={20} /></a>
          </div>
          <p className="text-sm text-neutral-500">
            © 2026 PureBG. Built with React & AI. All rights reserved.
          </p>
          <div className="mt-4">
            <a 
              href="https://www.netlify.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 transition-colors hover:text-emerald-500"
            >
              Optimized for Netlify
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
