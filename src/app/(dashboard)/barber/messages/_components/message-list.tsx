"use client";

import { Message, User } from "@prisma/client";
import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";

interface MessageListProps {
  messages: (Message & {
    sender: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    receiver: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  })[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  // Mesajları müşteri bazında grupla
  const conversations = messages.reduce((acc, message) => {
    const otherUserId = message.senderId === currentUserId 
      ? message.receiverId 
      : message.senderId;
    
    if (!acc[otherUserId]) {
      acc[otherUserId] = {
        user: message.senderId === currentUserId ? message.receiver : message.sender,
        messages: []
      };
    }
    
    acc[otherUserId].messages.push(message);
    return acc;
  }, {} as Record<string, { user: typeof messages[0]['sender'], messages: typeof messages }>);

  if (Object.keys(conversations).length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500 mb-4">Henüz mesaj bulunmuyor.</p>
        <p className="text-sm text-slate-400">Müşterilerinizle mesajlaşmaya başlayın.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.values(conversations).map((conversation) => (
        <div
          key={conversation.user.id}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            {conversation.user.image ? (
              <img
                src={conversation.user.image}
                alt={conversation.user.name || "Kullanıcı"}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <MessageSquare size={20} className="text-slate-400" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-900">
                {conversation.user.name || "İsimsiz Kullanıcı"}
              </h3>
              <p className="text-sm text-slate-500">{conversation.user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.senderId === currentUserId
                    ? "bg-slate-900 text-white ml-auto max-w-[80%]"
                    : "bg-slate-100 text-slate-900 max-w-[80%]"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === currentUserId
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}>
                  {new Date(message.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

