'use client';

import { useAuth } from '@/auth/provider';
import { Loader2, MessageSquare } from 'lucide-react';
import { redirect } from 'next/navigation';
import ChatLayout from './components/chat-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChatPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    redirect('/signin?callbackUrl=/chat');
  }

  return (
    <ChatLayout>
      <div className="hidden h-full flex-col items-center justify-center md:flex">
          <MessageSquare className="h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold">Select a conversation</h1>
          <p className="text-muted-foreground">
            Choose from your existing conversations to start chatting.
          </p>
      </div>
    </ChatLayout>
  );
}
