
'use client';

import React, { useMemo } from 'react';
import { Bell, Check, Trash2, Info, HelpCircle } from 'lucide-react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'survey';
  surveyQuestion?: string;
  surveyAnswer?: 'yes' | 'no' | null;
  read: boolean;
  createdAt: { toDate: () => Date };
};

export default function NotificationsDropdown() {
  const { user } = useUser();
  const firestore = useFirestore();

  const notificationsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [user, firestore]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);

  const unreadCount = useMemo(() => 
    notifications?.filter(n => !n.read).length || 0, 
  [notifications]);

  const markAsRead = async (id: string) => {
    if (!user || !firestore) return;
    try {
      await updateDoc(doc(firestore, 'users', user.uid, 'notifications', id), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleSurvey = async (e: React.MouseEvent, id: string, answer: 'yes' | 'no') => {
    e.stopPropagation();
    if (!user || !firestore) return;
    try {
      await updateDoc(doc(firestore, 'users', user.uid, 'notifications', id), {
        surveyAnswer: answer,
        read: true,
        message: `You answered "${answer}" to the survey.`
      });
    } catch (error) {
      console.error('Error answering survey:', error);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && <span className="text-[10px] text-muted-foreground">{unreadCount} unread</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {notifications && notifications.length > 0 ? (
            notifications.map((n) => (
              <DropdownMenuItem 
                key={n.id} 
                className={cn(
                  "flex flex-col items-start p-4 gap-1 cursor-pointer transition-colors",
                  !n.read && "bg-muted/50"
                )}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {n.type === 'survey' ? <HelpCircle className="h-4 w-4 text-primary" /> : <Info className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-semibold text-xs">{n.title}</span>
                  </div>
                  <button 
                    onClick={(e) => deleteNotification(e, n.id)}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {n.message}
                </p>
                {n.type === 'survey' && !n.surveyAnswer && (
                  <div className="flex gap-2 mt-2 w-full">
                    <Button size="sm" className="h-7 px-2 text-[10px] flex-1" onClick={(e) => handleSurvey(e, n.id, 'yes')}>Yes</Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] flex-1" onClick={(e) => handleSurvey(e, n.id, 'no')}>No</Button>
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
