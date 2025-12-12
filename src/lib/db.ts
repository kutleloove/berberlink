import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Geliştirme ortamı için geçici çözüm: URL'i doğrudan buraya yazıyoruz.
// .env dosyasındaki okuma sorunu çözülene kadar bu şekilde devam edelim.
// localhost yerine 127.0.0.1 kullanarak IPv4 zorlaması yapıyoruz.
const databaseUrl = "postgresql://myuser:mypassword@127.0.0.1:5432/berberlink?schema=public";

export const db = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
