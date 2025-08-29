'use client';

import { Card, CardContent } from "@/components/ui/card";
import { ChatList } from "./chat-list";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-8rem)]">
            <ChatList />
            <Card className="h-full">
                <CardContent className="h-full p-0">
                    {children}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
