'use client';

import { db } from '@/lib/firebase';
import type { Chat, Message } from '@/lib/types';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useEffect, useState, useRef, useTransition } from 'react';
import ChatLayout from '../components/chat-layout';
import { useAuth } from '@/auth/provider';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import Link from 'next/link';
import { sendMessage } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type ChatRoomPageProps = {
  params: {
    chatId: string;
  };
};

function ChatHeader({ chat, userId }: { chat: Chat; userId: string }) {
    const otherParticipantId = chat.participantIds.find(id => id !== userId);
    const otherParticipant = otherParticipantId ? chat.participants[otherParticipantId] : null;

    return (
        <div className="flex items-center gap-4 border-b p-4">
            <Avatar>
                <AvatarImage src={otherParticipant?.avatar} />
                <AvatarFallback>{otherParticipant?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className='flex-1'>
                <p className="font-semibold">{otherParticipant?.name}</p>
                <Link href={`/products/${chat.productId}`} className='text-sm text-muted-foreground hover:underline truncate'>
                   Re: {chat.productTitle}
                </Link>
            </div>
            <Link href={`/products/${chat.productId}`}>
                <Avatar className='h-12 w-12 rounded-md'>
                    <AvatarImage src={chat.productImageUrl} className='object-cover' />
                    <AvatarFallback>IMG</AvatarFallback>
                </Avatar>
            </Link>
        </div>
    )
}

function MessageList({ messages, userId }: { messages: Message[], userId: string }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages])

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className={cn("flex items-end gap-2", msg.senderId === userId ? 'justify-end' : 'justify-start')}>
                     {msg.senderId !== userId && <div className="h-8 w-8 shrink-0"></div>}
                     <div className={cn(
                        'max-w-xs rounded-lg p-3 lg:max-w-md', 
                        msg.senderId === userId 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted')}>
                        <p className='text-sm'>{msg.text}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

function MessageInput({ chatId, senderId }: { chatId: string, senderId: string }) {
    const [isSending, startSending] = useTransition();
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formRef.current) return;
        const formData = new FormData(formRef.current);
        const text = formData.get('text') as string;

        if(!text.trim()) return;

        startSending(async () => {
            const result = await sendMessage(formData);
            if(result.success) {
                formRef.current?.reset();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    }

    return (
        <form ref={formRef} onSubmit={handleSendMessage} className="flex items-center gap-2 border-t p-4">
            <input type="hidden" name="chatId" value={chatId} />
            <input type="hidden" name="senderId" value={senderId} />
            <Textarea
                name="text"
                placeholder="Type your message..."
                className="flex-1 resize-none"
                rows={1}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                }}
                disabled={isSending}
                required
            />
            <Button type="submit" size="icon" disabled={isSending}>
                {isSending ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
        </form>
    );
}


export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { chatId } = params;
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(chatRef, 'messages');
    
    // Fetch chat metadata once
    getDoc(chatRef).then(chatSnap => {
        if(chatSnap.exists()) {
            const chatData = chatSnap.data() as Chat;
            if (chatData.participantIds.includes(user.uid)) {
                setChat(chatData);
            }
        }
        setLoading(false);
    });

    // Listen for real-time messages
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => doc.data() as Message);
        setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  if (loading) {
    return (
        <ChatLayout>
            <div className="flex h-full flex-col">
                <div className="flex items-center gap-4 border-b p-4">
                    <Skeleton className='h-12 w-12 rounded-full' />
                    <div className='flex-1 space-y-2'>
                        <Skeleton className='h-4 w-32' />
                        <Skeleton className='h-3 w-48' />
                    </div>
                    <Skeleton className='h-12 w-12 rounded-md' />
                </div>
                <div className="flex-1 p-4 space-y-4">
                    <Skeleton className='h-10 w-3/4' />
                    <Skeleton className='h-10 w-2/4 ml-auto' />
                    <Skeleton className='h-10 w-3/5' />
                </div>
                <div className="flex items-center gap-2 border-t p-4">
                    <Skeleton className='h-10 flex-1' />
                    <Skeleton className='h-10 w-10' />
                </div>
            </div>
        </ChatLayout>
    )
  }

  if (!chat || !user) {
    return (
      <ChatLayout>
        <div className="p-4 text-center">
            <p>Chat not found or you do not have permission to view it.</p>
        </div>
      </ChatLayout>
    );
  }


  return (
    <ChatLayout>
      <div className="flex h-full flex-col">
        <ChatHeader chat={chat} userId={user.uid} />
        <MessageList messages={messages} userId={user.uid} />
        <MessageInput chatId={chat.id} senderId={user.uid} />
      </div>
    </ChatLayout>
  );
}
