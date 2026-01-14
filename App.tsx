
import React, { useState, useRef } from 'react';
import { ShotType, StudioSession, OutputAsset, ProductImage, BackgroundConfig } from './types';
import { SHOTS } from './constants';
import ShotCard from './components/ShotCard';
import { generateStudioShot } from './services/geminiService';

const BACKGROUND_PRESETS = [
  { name: 'Pure White', value: '#FFFFFF', type: 'color' as const },
  { name: 'Minimalist Grey', value: '#F2F2F2', type: 'color' as const },
  { name: 'Sandstone', value: '#E8E1D5', type: 'color' as const },
  { name: 'Soft Sage', value: '#D9E2D5', type: 'color' as const },
  { name: 'Dusty Rose', value: '#EBD9D9', type: 'color' as const },
];

const App: React.FC = () => {
  const [session, setSession] = useState<StudioSession>({
    productImages: [],
    selectedShots: [ShotType.HERO],
    customRequirements: '',
    backgroundConfig: { name: 'Pure White', value: '#FFFFFF', type: 'color' },
    outputAssets: [],
    isLoading: false,
    currentProductIndex: 0,
    currentShotIndex: 0,
  });
  const [selectedForDownload, setSelectedForDownload] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (session.productImages.length + files.length > 10) {
      setError("Maximum 10 product images allowed.");
      return;
    }

    const newImages: ProductImage[] = [];
    let loadedCount = 0;

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          data: reader.result as string,
          name: file.name
        });
        loadedCount++;
        if (loadedCount === files.length) {
          setSession(prev => ({ 
            ...prev, 
            productImages: [...prev.productImages, ...newImages] 
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    setError(null);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSession(prev => ({
        ...prev,
        backgroundConfig: {
          type: 'image',
          value: reader.result as string,
          name: file.name
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeProduct = (id: string) => {
    setSession(prev => ({
      ...prev,
      productImages: prev.productImages.filter(p => p.id !== id)
    }));
  };

  const toggleShotSelection = (id: ShotType) => {
    setSession(prev => {
      const isSelected = prev.selectedShots.includes(id);
      if (isSelected) {
        if (prev.selectedShots.length <= 1) return prev;
        return { ...prev, selectedShots: prev.selectedShots.filter(s => s !== id) };
      } else {
        return { ...prev, selectedShots: [...prev.selectedShots, id] };
      }
    });
  };

  const toggleDownloadSelection = (index: number) => {
    const newSet = new Set(selectedForDownload);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedForDownload(newSet);
  };

  const getRandomModelProfile = () => {
    const tones = [
      "Fair skin tone with delicate features",
      "Warm brown skin tone with a radiant glow",
      "Deep dark skin tone with high-fashion striking features",
      "Medium honey skin tone with a soft approachable look",
      "Tan skin tone with elegant sharp features"
    ];
    const hair = [
      "dark wavy hair styled in soft layers",
      "sleek straight dark hair with a middle part",
      "voluminous dark curls framing the face",
      "neat low bun with soft wisps of dark hair",
      "long dark hair with soft beachy waves"
    ];
    
    const tone = tones[Math.floor(Math.random() * tones.length)];
    const hairStyle = hair[Math.floor(Math.random() * hair.length)];
    
    return `MODEL PROFILE: South Asian woman with ${tone}. Hair: ${hairStyle}. Maintain identical facial structure and ethnicity across all poses. Primary angle: Front-facing professional catalog style.`;
  };

  const handleGenerate = async () => {
    if (session.productImages.length === 0) {
      setError("Please upload at least one product photograph.");
      return;
    }

    setSession(prev => ({ 
      ...prev, 
      isLoading: true, 
      outputAssets: [], 
      currentProductIndex: 0,
      currentShotIndex: 0
    }));
    setSelectedForDownload(new Set());
    setError(null);

    const totalProducts = session.productImages.length;
    const totalShots = session.selectedShots.length;
    const finalAssets: OutputAsset[] = [];

    try {
      for (let pIdx = 0; pIdx < totalProducts; pIdx++) {
        const modelProfile = getRandomModelProfile();
        
        for (let sIdx = 0; sIdx < totalShots; sIdx++) {
          setSession(prev => ({ ...prev, currentProductIndex: pIdx, currentShotIndex: sIdx }));
          
          const product = session.productImages[pIdx];
          const shotId = session.selectedShots[sIdx];
          const shotDef = SHOTS.find(s => s.id === shotId)!;
          
          const resultUrl = await generateStudioShot(
            product.data,
            shotDef.instruction,
            session.customRequirements,
            modelProfile,
            session.backgroundConfig
          );

          if (resultUrl) {
            const newAsset: OutputAsset = {
              shotId: shotId,
              productId: product.id,
              url: resultUrl,
              label: `${product.name} - ${shotDef.label}`
            };
            finalAssets.push(newAsset);
            setSession(prev => ({ ...prev, outputAssets: [...finalAssets] }));
          }
        }
      }
      setSession(prev => ({ ...prev, isLoading: false }));
    } catch (err: any) {
      setError(err.message || "An error occurred during the batch studio shoot.");
      setSession(prev => ({ ...prev, isLoading: false }));
    }
  };

  const downloadSessionAssets = async (assetsToDownload: OutputAsset[]) => {
    for (let i = 0; i < assetsToDownload.length; i++) {
      const asset = assetsToDownload[i];
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            try {
              const jpgUrl = canvas.toDataURL('image/jpeg', 0.95);
              const link = document.createElement('a');
              link.href = jpgUrl;
              link.download = `Studio-AI-${asset.label.replace(/[^a-z0-9]/gi, '-')}.jpg`;
              
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (e) {
              console.error("Canvas export failed", e);
            }
          }
          setTimeout(resolve, 400);
        };
        img.onerror = () => {
          console.error("Image failed to load for download processing", asset.label);
          resolve();
        };
        img.src = asset.url;
      });
    }
  };

  const downloadSelected = () => {
    const assets = Array.from(selectedForDownload)
      .map(index => session.outputAssets[index])
      .filter(Boolean);
    if (assets.length > 0) {
      downloadSessionAssets(assets);
    }
  };

  const downloadAll = () => {
    if (session.outputAssets.length > 0) {
      downloadSessionAssets(session.outputAssets);
    }
  };

  const selectAllOutputs = () => {
    if (selectedForDownload.size === session.outputAssets.length) {
      setSelectedForDownload(new Set());
    } else {
      setSelectedForDownload(new Set(session.outputAssets.map((_, i) => i)));
    }
  };

  const resetSession = () => {
    setSession({
      productImages: [],
      selectedShots: [ShotType.HERO],
      customRequirements: '',
      backgroundConfig: { name: 'Pure White', value: '#FFFFFF', type: 'color' },
      outputAssets: [],
      isLoading: false,
      currentProductIndex: 0,
      currentShotIndex: 0,
    });
    setSelectedForDownload(new Set());
    setError(null);
  };

  const currentShotDef = SHOTS.find(s => s.id === session.selectedShots[session.currentShotIndex]);
  const currentProduct = session.productImages[session.currentProductIndex];

  return (
    <div className="min-h-screen flex flex-col pb-12">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white w-10 h-10 flex items-center justify-center font-serif text-xl rounded-lg">AI</div>
          <div>
            <p className="text-sm font-bold tracking-tight text-gray-900 uppercase">Studio AI</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Pro Catalog • Shadowless Front Angle</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={resetSession} className="text-xs px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
            Clear Workspace
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 font-serif">
              <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-sans">1</span>
              Source Products ({session.productImages.length}/10)
            </h2>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {session.productImages.map((img) => (
                <div key={img.id} className="relative group aspect-[9/16] rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                  <img src={img.data} alt="Product" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeProduct(img.id)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {session.productImages.length < 10 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[9/16] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center hover:border-black transition-colors bg-white"
                >
                  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 text-center px-2">Upload Product</span>
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 font-serif">
              <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-sans">2</span>
              Portrait Poses (9:16)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {SHOTS.map((shot) => (
                <ShotCard 
                  key={shot.id} 
                  shot={shot} 
                  isSelected={session.selectedShots.includes(shot.id)}
                  onSelect={toggleShotSelection}
                />
              ))}
            </div>
          </section>

          {/* New Background Studio Section */}
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 font-serif">
              <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-sans">3</span>
              Background Studio
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-5 gap-2">
                {BACKGROUND_PRESETS.map((bg) => (
                  <button
                    key={bg.name}
                    onClick={() => setSession(prev => ({ ...prev, backgroundConfig: bg }))}
                    className={`aspect-square rounded-lg border-2 transition-all relative overflow-hidden flex items-center justify-center ${
                      session.backgroundConfig.type === 'color' && session.backgroundConfig.value === bg.value 
                        ? 'border-black ring-2 ring-black/5' 
                        : 'border-transparent hover:border-gray-200'
                    }`}
                    title={bg.name}
                  >
                    <div className="w-full h-full" style={{ backgroundColor: bg.value }}></div>
                    {session.backgroundConfig.type === 'color' && session.backgroundConfig.value === bg.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className={`w-4 h-4 ${bg.name === 'Pure White' ? 'text-black' : 'text-white'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Custom Color</p>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={session.backgroundConfig.type === 'color' ? session.backgroundConfig.value : '#FFFFFF'} 
                      onChange={(e) => setSession(prev => ({ ...prev, backgroundConfig: { type: 'color', value: e.target.value.toUpperCase(), name: 'Custom' } }))}
                      className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
                    />
                    <input 
                      type="text" 
                      value={session.backgroundConfig.type === 'color' ? session.backgroundConfig.value : ''} 
                      onChange={(e) => setSession(prev => ({ ...prev, backgroundConfig: { type: 'color', value: e.target.value.toUpperCase(), name: 'Custom' } }))}
                      placeholder="#HEXCODE"
                      className="flex-1 text-xs font-mono px-3 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
                    />
                  </div>
                </div>
                <div className="w-px bg-gray-100 h-10 self-end mb-1"></div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Custom Image</p>
                  <button 
                    onClick={() => bgInputRef.current?.click()}
                    className={`w-full h-10 border rounded-lg text-[10px] font-bold uppercase tracking-tighter flex items-center justify-center gap-2 transition-all ${
                      session.backgroundConfig.type === 'image' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {session.backgroundConfig.type === 'image' ? (
                      <span className="truncate px-2">{session.backgroundConfig.name}</span>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Upload Bg
                      </>
                    )}
                  </button>
                  <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={handleBgUpload} />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 font-serif">
              <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-sans">4</span>
              Studio Directives
            </h2>
            <p className="text-[10px] text-blue-500 font-bold uppercase mb-2">Essential for unstitched fabric / specific styling</p>
            <textarea
              value={session.customRequirements}
              onChange={(e) => setSession(prev => ({ ...prev, customRequirements: e.target.value }))}
              placeholder="E.g., 'Model should wear the unstitched material as a classic pleated saree', or 'Ensure soft brown skin tone for the model'..."
              className="w-full h-32 p-4 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500/5 focus:border-pink-500 outline-none transition-all resize-none bg-gray-50/30 text-black placeholder-gray-400"
            />
          </section>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

          <button
            onClick={handleGenerate}
            disabled={session.isLoading || session.productImages.length === 0}
            className={`w-full py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all ${
              session.isLoading || session.productImages.length === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10'
            }`}
          >
            {session.isLoading ? (
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Batch...
                </span>
                <span className="text-[8px] opacity-70 uppercase tracking-widest mt-1">
                  Product {session.currentProductIndex + 1}/{session.productImages.length} • {currentShotDef?.label}
                </span>
              </div>
            ) : (
              <span>Launch Shadowless Shoot ({session.productImages.length * session.selectedShots.length} Photos)</span>
            )}
          </button>
        </div>

        {/* Right Column: Output Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2 flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-gray-900">Portrait Gallery (9:16)</h2>
              <p className="text-xs text-gray-400">
                {session.outputAssets.length > 0 
                  ? `${session.outputAssets.length} images ready • Front Angle Shadowless Shoot` 
                  : 'High-end catalog results will appear here.'}
              </p>
            </div>
            {session.outputAssets.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-end">
                <button 
                  onClick={selectAllOutputs}
                  className="text-[10px] font-bold px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 uppercase tracking-widest transition-colors"
                >
                  {selectedForDownload.size === session.outputAssets.length ? 'Deselect All' : 'Select All'}
                </button>
                <button 
                  onClick={downloadSelected}
                  disabled={selectedForDownload.size === 0}
                  className={`text-[10px] font-bold px-4 py-2 rounded-lg flex items-center gap-2 uppercase tracking-widest transition-all ${
                    selectedForDownload.size === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-black text-white hover:bg-gray-800 shadow-md'
                  }`}
                >
                  Download Selected ({selectedForDownload.size})
                </button>
                <button 
                  onClick={downloadAll}
                  className="text-[10px] font-bold px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 uppercase tracking-widest shadow-md flex items-center gap-2 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All ({session.outputAssets.length})
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 bg-white border border-gray-100 rounded-3xl overflow-y-auto p-6 shadow-inner min-h-[700px]">
            {session.outputAssets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {session.outputAssets.map((asset, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => toggleDownloadSelection(idx)}
                    className={`group relative bg-white rounded-2xl overflow-hidden border transition-all cursor-pointer aspect-[9/16] flex flex-col ${
                      selectedForDownload.has(idx) ? 'border-black ring-2 ring-black ring-inset shadow-md' : 'border-gray-100 hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    <img src={asset.url} alt={asset.label} className="w-full flex-1 object-cover" />
                    <div className={`absolute top-4 right-4 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedForDownload.has(idx) ? 'bg-black border-black text-white' : 'bg-white/90 border-gray-200 text-transparent'
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="p-4 bg-white/95 backdrop-blur-sm border-t border-gray-50 flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-pink-500">Front Angle • {session.backgroundConfig.name}</span>
                      <span className="text-[10px] font-bold text-gray-700 truncate">{asset.label}</span>
                    </div>
                  </div>
                ))}
                {session.isLoading && (
                  <div className="aspect-[9/16] border-2 border-dashed border-pink-100 bg-pink-50/10 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                    <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest italic">Capturing Studio Portrait...</p>
                    <p className="text-[8px] text-pink-300 mt-1 uppercase font-semibold">{currentShotDef?.label}</p>
                  </div>
                )}
              </div>
            ) : session.isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 border-4 border-pink-50 border-t-pink-500 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-serif text-pink-600 font-bold uppercase tracking-tight italic text-center">Rendering Studio catalog</h3>
                <p className="text-sm text-gray-400 mt-2 max-w-xs leading-relaxed text-center">
                  Generating front-angle, shadowless portraits for <strong>{currentProduct?.name}</strong> with professional studio precision.
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 text-gray-300">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-serif uppercase tracking-widest font-bold text-gray-200 text-center">Shadowless Studio Workspace</h3>
                <p className="text-xs mt-2 max-w-xs leading-relaxed text-gray-400 text-center">Every product features a unique model consistent across all front-angle, shadowless poses.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <div className="bg-white p-5 rounded-xl border border-gray-50 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-pink-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
            <h4>Environment Consistency</h4>
          </div>
          <p className="font-normal normal-case text-gray-500">Locked background settings ensure that every product shoot maintains a perfectly uniform environment across all shots.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-50 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" /></svg>
            <h4>Front-Angle Focus</h4>
          </div>
          <p className="font-normal normal-case text-gray-500">Every shot is optimized for catalog clarity with a professional front-facing camera perspective.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-50 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-orange-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <h4>Clean Studio Export</h4>
          </div>
          <p className="font-normal normal-case text-gray-500">Strict no-logo policy and ultra-soft, diffused finishes ensure every image is professional-ready.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
