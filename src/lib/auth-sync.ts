import { db } from "./db";
import { currentUser } from "@clerk/nextjs/server";

export const syncUser = async () => {
  console.log("syncUser: currentUser() çağrılıyor...");
  const user = await currentUser();

  if (!user) {
    console.log("syncUser: Kullanıcı oturum açmamış.");
    return null;
  }
  
  console.log("syncUser: Kullanıcı bulundu:", user.emailAddresses[0].emailAddress);

  // Veritabanında kullanıcı var mı kontrol et
  console.log("syncUser: db.user.findUnique çağrılıyor...");
  const existingUser = await db.user.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
  });

  // Varsa döndür
  if (existingUser) {
    console.log("syncUser: Veritabanında mevcut kullanıcı bulundu.");
    return existingUser;
  }

  console.log("syncUser: Yeni kullanıcı oluşturuluyor...");
  // Yoksa yeni oluştur
  // Admin kontrolü: Eğer email .env dosyasındaki ADMIN_EMAIL ile eşleşiyorsa rolü ADMIN yap
  const role = user.emailAddresses[0].emailAddress === process.env.ADMIN_EMAIL ? "ADMIN" : "CUSTOMER";

  const newUser = await db.user.create({
    data: {
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`,
      image: user.imageUrl,
      role: role, 
    },
  });
  console.log("syncUser: Yeni kullanıcı oluşturuldu:", newUser.id);

  return newUser;
};
