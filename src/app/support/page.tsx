'use client';

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, MessageCircle, Send, Bot, User, Loader2, ImagePlus, Download, X, ImageIcon, Sparkles, MessageSquare, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supportAgent } from '@/ai/flows/support-agent-flow';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  sender: 'user' | 'bot';
  text: string;
  image?: string;
  recreatedImage?: string;
  mode?: 'chat' | 'generate' | 'recreate';
}

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(new Error('Failed to read file: ' + (error.target?.error?.message || 'Unknown error')));
    reader.readAsDataURL(file);
});

const compressBase64Image = async (base64: string, maxWidth = 1200, maxHeight = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
};

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'generate' | 'recreate'>('chat');
  const [isMounted, setIsMounted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File Too Large', description: 'Please select an image under 5MB.' });
        return;
    }

    setIsUploadingImage(true);
    try {
        const base64 = await fileToBase64(file);
        setSelectedImage(base64);
        if (activeTab === 'chat') {
            setActiveTab('recreate');
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not read the image file.' });
    } finally {
        setIsUploadingImage(false);
    }
  };

  const handleDownload = (dataUri: string) => {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `dove-neb-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    if (activeTab === 'recreate' && !selectedImage) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Please upload an image to optimize.' });
        return;
    }

    const userMessage: Message = { 
        sender: 'user', 
        text: input || (activeTab === 'generate' ? "Create a professional room image." : "Optimize my image."),
        image: selectedImage || undefined,
        mode: activeTab
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentQuery = input;
    const currentImage = selectedImage;
    const currentMode = activeTab;
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const result = await supportAgent({ 
        query: currentQuery || (currentMode === 'generate' ? "Create a high-quality modern interior photo." : "Optimize this image for real estate."), 
        imageDataUri: currentImage || undefined,
        mode: currentMode
      });
      
      let finalMedia = result.recreatedImage;

      if (finalMedia) {
          setIsCompressing(true);
          try {
              finalMedia = await compressBase64Image(finalMedia, 1000, 750, 0.6);
          } catch (compErr) {
              console.error("Compression error:", compErr);
          } finally {
              setIsCompressing(false);
          }
      }

      const botMessage: Message = { 
        sender: 'bot', 
        text: result.response,
        recreatedImage: finalMedia
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('AI agent error:', error);
      const errorMessage: Message = {
        sender: 'bot',
        text: 'I hit a snag. Please try again or check your internet connection.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (activeTab) {
        case 'generate': return "Describe the image you want to create...";
        case 'recreate': return "Describe how you want to optimize this image...";
        default: return "Ask Neb anything or upload an image to optimize...";
    }
  };

  if (!isMounted) return null;

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <Card className="h-[80vh] flex flex-col shadow-xl border-t-4 border-t-primary overflow-hidden">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                    <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-xl font-headline">Neb AI Agent</CardTitle>
                    <CardDescription className="text-xs">Online and ready to assist</CardDescription>
                </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-3 h-9">
                    <TabsTrigger value="chat" className="text-xs"><MessageSquare className="h-3 w-3 mr-1 sm:hidden" /> <span className="hidden sm:inline">Support</span></TabsTrigger>
                    <TabsTrigger value="generate" className="text-xs"><Sparkles className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">New Image</span></TabsTrigger>
                    <TabsTrigger value="recreate" className="text-xs"><Wand2 className="h-3 w-3 mr-1" /> <span className="hidden sm:inline">Optimize</span></TabsTrigger>
                </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="bg-primary/5 p-6 rounded-full">
                    <Bot className="h-16 w-16 text-primary/40" />
                  </div>
                  <div className="max-w-xs">
                    <h3 className="font-semibold text-lg">Hi, I'm Neb!</h3>
                    <p className="text-sm text-muted-foreground">
                        I can help you with support questions, generate brand new listing photos, or optimize your existing images to fit platform limits.
                    </p>
                  </div>
              </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.sender === 'bot' && (
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted rounded-tl-none'
                }`}
              >
                {message.image && (
                    <div className="mb-2">
                        <p className="text-[10px] mb-1 opacity-70 italic">Source Image:</p>
                        <img src={message.image} alt="User upload" className="rounded-lg max-h-48 object-cover border border-white/20" />
                    </div>
                )}
                
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                
                {message.recreatedImage && (
                    <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                        <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" /> AI Generated Media:
                        </p>
                        <img src={message.recreatedImage} alt="Neb output" className="rounded-lg max-h-64 w-full object-cover border shadow-md bg-background" />
                        <div className="flex items-center gap-2 mt-2">
                            <Button 
                                size="sm" 
                                variant="secondary" 
                                className="w-full h-8 text-xs font-medium" 
                                onClick={() => handleDownload(message.recreatedImage!)}
                            >
                                <Download className="h-3 w-3 mr-2" /> Download & Save
                            </Button>
                        </div>
                        <p className="text-[9px] mt-1 text-center opacity-60">This image is optimized to fit comfortably in room listings.</p>
                    </div>
                )}
              </div>
               {message.sender === 'user' && (
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-secondary text-secondary-foreground"><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {(isLoading || isCompressing) && (
             <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-2 rounded-tl-none flex items-center gap-2">
                   <Loader2 className="h-4 w-4 animate-spin text-primary" />
                   <span className="text-xs text-muted-foreground">
                       {isCompressing ? 'Finalizing image...' : activeTab === 'generate' ? 'Neb is painting...' : 'Neb is thinking...'}
                   </span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        
        <div className="p-4 border-t bg-muted/10">
          {selectedImage && (
              <div className="mb-3 relative inline-block">
                  <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-md border-2 border-primary" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90"
                  >
                      <X className="h-3 w-3" />
                  </button>
              </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            {activeTab !== 'generate' && (
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploadingImage || isCompressing}
                    className="rounded-full shrink-0"
                >
                {isUploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                </Button>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={isLoading || isCompressing}
              className="rounded-full focus-visible:ring-primary h-11"
            />
            <Button type="submit" disabled={isLoading || isCompressing || (!input.trim() && !selectedImage)} className="rounded-full shrink-0 h-11 w-11 p-0">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
      
       <Card className="mt-8 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg">Need Human Help?</CardTitle>
            <CardDescription>If Neb can't solve your issue, reach out to us directly.</CardDescription>
        </CardHeader>
         <CardContent className="grid sm:grid-cols-2 gap-4 p-4">
          <a href="mailto:dovenebinfo@gmail.com" className="flex items-center gap-4 rounded-xl border p-4 hover:bg-muted transition-colors group">
            <div className="bg-primary/10 p-3 rounded-full group-hover:bg-primary/20">
                <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Email Support</h3>
              <p className="text-xs text-muted-foreground">dovenebinfo@gmail.com</p>
            </div>
          </a>
          <a href="https://wa.me/+233500863382" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-xl border p-4 hover:bg-muted transition-colors group">
            <div className="bg-green-500/10 p-3 rounded-full group-hover:bg-green-500/20">
                <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">WhatsApp Support</h3>
              <p className="text-xs text-muted-foreground">+233 50 086 3382</p>
            </div>
          </a>
        </CardContent>
       </Card>
    </div>
  );
}