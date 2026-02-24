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

  expensePhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async () => {
      const { userId, role } = await requireSession();
      if (role !== "MANAGER") {
        throw new UploadThingError("Accesso riservato al manager");
      }
      return { userId, role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, uploadedBy: metadata.userId };
    }),

  analysisFile: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 }, image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId, role } = await requireSession();
      if (role !== "MANAGER") {
        throw new UploadThingError("Accesso riservato al manager");
      }
      return { userId, role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, uploadedBy: metadata.userId };
    }),
  masterfilePhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId, role } = await requireSession();
      return { userId, role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, uploadedBy: metadata.userId };
    }),

  masterfileDoc: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 }, image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      const { userId, role } = await requireSession();
      return { userId, role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.ufsUrl, uploadedBy: metadata.userId };
    }),

  // Public onboarding file uploads (no auth — owner fills form via token)
  onboardingPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      return { public: true };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  onboardingDoc: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 }, image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async () => {
      return { public: true };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
