import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MessageList } from "./_components/message-list";

export default async function MessagesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  // Berberin gönderdiği ve aldığı mesajları getir
  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: dbUser.id },
        { receiverId: dbUser.id }
      ]
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mesajlar</h1>
        <p className="text-sm text-slate-500 mt-1">Müşterilerinizle mesajlaşın</p>
      </div>

      <MessageList messages={messages} currentUserId={dbUser.id} />
    </div>
  );
}

