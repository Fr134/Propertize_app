import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UploadThingError("Non autorizzato");
  }
  return { userId: session.user.id, role: session.user.role as string };
}

export const ourFileRouter = {
  taskPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId, role } = await requireSession();
      return { userId, role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, uploadedBy: metadata.userId };
    }),

  reportPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async () => {
      const { userId, role } = await requireSession();
      return { userId, role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
