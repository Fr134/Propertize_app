import { Card, CardContent } from "@/components/ui/card";

export default function GraziePage() {
  return (
    <Card>
      <CardContent className="py-16 text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold">Grazie!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Abbiamo ricevuto tutti i dati. Il nostro team li verificherà e ti
          contatterà a breve.
        </p>
        <p className="text-sm text-muted-foreground">
          Per informazioni:{" "}
          <a
            href="mailto:info@propertize.it"
            className="text-primary hover:underline"
          >
            info@propertize.it
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
