"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (session?.user?.role === "MANAGER") {
      router.replace("/manager");
    } else if (session?.user?.role === "OPERATOR") {
      router.replace("/operator");
    }
  }, [status, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Image
          src="/propertize-logo.png"
          alt="Propertize"
          width={320}
          height={80}
          className="h-16 w-auto mx-auto rounded-lg"
          priority
        />
        <p className="mt-4 text-lg text-muted-foreground">
          Housekeeping Management App
        </p>
      </div>
    </div>
  );
}
