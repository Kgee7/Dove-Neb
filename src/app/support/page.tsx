
'use client';

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, MessageCircle, Send, Bot, User, Loader2, ImagePlus, Download, X, ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supportAgent } from '@/ai/flows/support-agent-flow';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  image?: string;
  recreatedImage?: string;
}

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(new Error('Failed to read file: ' + (error.target?.error?.message || 'Unknown error')));
    reader.readAsDataURL(file);
});

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    link.download = 'optimized-room-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = { 
        sender: 'user', 
        text: input || (selectedImage ? "Please process this image for me." : ""),
        image: selectedImage || undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentQuery = input;
    const currentImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const result = await supportAgent({ 
        query: currentQuery || "Please recreate this image.", 
        imageDataUri: currentImage || undefined 
      });
      
      const botMessage: Message = { 
        sender: 'bot', 
        text: result.response,
        recreatedImage: result.recreatedImage
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('AI agent error:', error);
      const errorMessage: Message = {
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting. Please try again later.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card className="h-[75vh] flex flex-col shadow-xl border-t-4 border-t-primary">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                    <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-xl font-headline">Neb - Dove Neb Agent</CardTitle>
                    <CardDescription className="text-xs">Online and ready to help</CardDescription>
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="bg-primary/5 border rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground text-center">
                Need to optimize images for your room listing? Just upload them here and ask me to "recreate" them to fit our 1-2MB limit!
            </p>
          </div>
          
          {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-50">
                  <Bot className="h-12 w-12 mb-2" />
                  <p>How can I help you today?</p>
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
                        <p className="text-[10px] mb-1 opacity-70 italic">Original uploaded image:</p>
                        <img src={message.image} alt="User upload" className="rounded-lg max-h-48 object-cover border border-white/20" />
                    </div>
                )}
                
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                
                {message.recreatedImage && (
                    <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                        <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" /> Optimized Image:
                        </p>
                        <img src={message.recreatedImage} alt="Recreated" className="rounded-lg max-h-64 object-cover border shadow-md bg-background" />
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            className="w-full mt-2 h-8 text-xs" 
                            onClick={() => handleDownload(message.recreatedImage!)}
                        >
                            <Download className="h-3 w-3 mr-2" /> Download for Listing
                        </Button>
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
          {isLoading && (
             <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-2 rounded-tl-none">
                   <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
            <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploadingImage}
                className="rounded-full shrink-0"
            >
              {isUploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or upload an image to optimize..."
              disabled={isLoading}
              className="rounded-full focus-visible:ring-primary"
            />
            <Button type="submit" disabled={isLoading || (!input.trim() && !selectedImage)} className="rounded-full shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
      
       <Card className="mt-8 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="text-lg">Contact our Support Team</CardTitle>
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
