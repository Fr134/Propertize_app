import Image from "next/image";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Image
            src="/propertize-logo.png"
            alt="Propertize"
            width={160}
            height={40}
            className="h-9 w-auto rounded-lg"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            Onboarding proprietario
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
