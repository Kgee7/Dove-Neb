
'use client';

import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, MessageCircle, Send, Bot, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supportAgent } from '@/ai/flows/support-agent-flow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await supportAgent({ query: input });
      const botMessage: Message = { sender: 'bot', text: result.response };
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
      <Card className="h-[75vh] flex flex-col">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <Bot /> AI Support Agent - Neb
          </CardTitle>
          <CardDescription>
            Ask me anything about Dove Neb. If I can't help, I'll direct you to our human support team.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.sender === 'bot' && (
                  <Avatar>
                    <AvatarFallback><Bot /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-md rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
                 {message.sender === 'user' && (
                  <Avatar>
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
               <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback><Bot /></AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                     <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
      
       <Card className="mt-8">
        <CardHeader>
            <CardTitle>Contact our Support Team</CardTitle>
            <CardDescription>If you need further assistance, reach out to us directly.</CardDescription>
        </CardHeader>
         <CardContent className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">Email Support</h3>
              <a href="mailto:dovenebinfo@gmail.com" className="text-muted-foreground hover:underline">
                dovenebinfo@gmail.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">WhatsApp Support</h3>
              <a href="https://wa.me/+233500863382" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline">
                wa.me/+233500863382
              </a>
            </div>
          </div>
        </CardContent>
       </Card>
    </div>
  );
}
