import React, { useState, useRef, useEffect } from 'react';
import { recognizeDocument, TextBlock } from '@/lib/gemini';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Loader2, Upload, Download, Edit3, Type, Save, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'motion/react';

export default function DocumentEditor() {
  const [image, setImage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setBlocks([]);
        setSelectedBlockIndex(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!image) return;
    setIsLoading(true);
    try {
      const result = await recognizeDocument(image);
      setBlocks(result);
      toast.success('Documento procesado con éxito');
    } catch (error) {
      console.error(error);
      toast.error('Error al procesar el documento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!editorRef.current) return;
    try {
      const canvas = await html2canvas(editorRef.current, {
        useCORS: true,
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'documento-editado.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Documento exportado');
    } catch (error) {
      console.error(error);
      toast.error('Error al exportar');
    }
  };

  const updateBlockText = (index: number, newText: string) => {
    const newBlocks = [...blocks];
    newBlocks[index].text = newText;
    setBlocks(newBlocks);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#F5F5F4] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-full lg:w-80 bg-white border-r border-[#E5E5E5] flex flex-col h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2">DocuEdit OCR</h1>
          <p className="text-sm text-[#71717A] mb-6">Edita tus documentos conservando el formato original.</p>
          
          <div className="space-y-4">
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 border-[#E5E5E5] hover:bg-[#F5F5F4]"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Subir Documento
            </Button>
            
            <Button 
              className="w-full gap-2 bg-[#1A1A1A] text-white hover:bg-[#2D2D2D]"
              disabled={!image || isLoading}
              onClick={handleProcess}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
              Procesar OCR
            </Button>
          </div>
        </div>

        <Separator className="bg-[#E5E5E5]" />

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {blocks.length > 0 && (
              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-widest text-[#71717A] font-semibold">Bloques de Texto</Label>
                {blocks.map((block, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedBlockIndex === idx 
                        ? 'border-[#1A1A1A] bg-[#F5F5F4]' 
                        : 'border-[#E5E5E5] hover:border-[#A1A1AA]'
                    }`}
                    onClick={() => setSelectedBlockIndex(idx)}
                  >
                    <p className="text-sm truncate font-medium">{block.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-[#71717A] bg-[#E5E5E5] px-1.5 py-0.5 rounded uppercase font-mono">
                        {block.fontWeight || 'normal'}
                      </span>
                      <span className="text-[10px] text-[#71717A] bg-[#E5E5E5] px-1.5 py-0.5 rounded uppercase font-mono">
                        {block.fontSize ? `${Math.round(block.fontSize)}px` : 'auto'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!image && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-[#F5F5F4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Type className="w-6 h-6 text-[#A1A1AA]" />
                </div>
                <p className="text-sm text-[#71717A]">Sube una imagen para comenzar.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-[#E5E5E5] bg-white">
          <Button 
            variant="outline" 
            className="w-full gap-2 border-[#E5E5E5] hover:bg-[#F5F5F4]"
            disabled={blocks.length === 0}
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            Exportar PNG
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Toolbar */}
        <div className="h-14 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedBlockIndex !== null && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <Input 
                  className="h-8 w-64 text-sm"
                  value={blocks[selectedBlockIndex].text}
                  onChange={(e) => updateBlockText(selectedBlockIndex, e.target.value)}
                  autoFocus
                />
                <Button variant="ghost" size="icon" onClick={() => setSelectedBlockIndex(null)}>
                  <Save className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <ScrollArea className="flex-1 bg-[#E5E5E5] p-8">
          <div className="flex justify-center min-h-full">
            <div 
              className="relative shadow-2xl bg-white origin-top transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              {image ? (
                <div ref={editorRef} className="relative">
                  <img 
                    src={image} 
                    alt="Document" 
                    className="max-w-none block"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Overlay Blocks */}
                  {blocks.map((block, idx) => {
                    const [ymin, xmin, ymax, xmax] = block.box_2d;
                    return (
                      <div
                        key={idx}
                        className={`absolute group cursor-text transition-all ${
                          selectedBlockIndex === idx ? 'ring-2 ring-[#1A1A1A] bg-white/80' : 'hover:bg-white/40'
                        }`}
                        style={{
                          top: `${ymin / 10}%`,
                          left: `${xmin / 10}%`,
                          width: `${(xmax - xmin) / 10}%`,
                          height: `${(ymax - ymin) / 10}%`,
                          fontSize: block.fontSize ? `${block.fontSize}px` : 'inherit',
                          fontWeight: block.fontWeight === 'bold' ? 'bold' : 'normal',
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          color: 'black',
                          backgroundColor: 'white', // Covering original text
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBlockIndex(idx);
                        }}
                      >
                        <span className="w-full text-center px-1">
                          {block.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-[600px] h-[800px] bg-white flex flex-col items-center justify-center text-[#A1A1AA]">
                  <Upload className="w-12 h-12 mb-4 opacity-20" />
                  <p>Sube un documento para empezar</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
