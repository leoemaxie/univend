
'use client';

import { useAuth } from "@/auth/provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Chat } from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getChatsForUser } from "../actions";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

export function ChatList() {
    const { user } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const params = useParams();

    useEffect(() => {
        if(user) {
            setLoading(true);
            getChatsForUser(user.uid).then(userChats => {
                // Sort chats by last message timestamp, descending.
                const sortedChats = userChats.sort((a, b) => {
                    const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
                    const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
                    return timeB - timeA;
                });
                setChats(sortedChats);
            }).catch(error => {
                console.error("Failed to fetch chats:", error);
            }).finally(() => {
                setLoading(false);
            })
        }
    }, [user]);

    if (!user) return null;

    return (
        <Card className="h-full overflow-y-auto">
            <CardHeader>
                <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : chats.length > 0 ? (
                    <div className="space-y-2">
                        {chats.map(chat => {
                             const otherParticipantId = chat.participantIds.find(id => id !== user.uid);
                             const otherParticipant = otherParticipantId ? chat.participants[otherParticipantId] : null;
                             const lastMessage = chat.lastMessage;

                             return (
                                <Link href={`/chat/${chat.id}`} key={chat.id}>
                                    <div className={cn(
                                        "flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted",
                                        params.chatId === chat.id && "bg-muted"
                                    )}>
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={otherParticipant?.avatar} />
                                            <AvatarFallback>{otherParticipant?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 truncate">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold truncate">{otherParticipant?.name}</p>
                                                {lastMessage && (
                                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {lastMessage ? `${lastMessage.senderId === user.uid ? 'You: ' : ''}${lastMessage.text}` : 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                             )
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No conversations yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
