import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function GraziePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Grazie!
          </h1>
          <p className="text-muted-foreground">
            Abbiamo ricevuto la tua richiesta. Ti contatteremo entro 48 ore con
            la tua analisi personalizzata.
          </p>
          <Image
            src="/propertize-logo.png"
            alt="Propertize"
            width={160}
            height={40}
            className="h-8 w-auto mx-auto rounded-lg"
          />
        </CardContent>
      </Card>
    </div>
  );
}
