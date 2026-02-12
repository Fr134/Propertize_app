import { prisma } from "@/lib/prisma";
import { json, errorResponse, requireAuth } from "@/lib/api-utils";

// POST /api/reports/[id]/photos - Add photo to report
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { photoUrl } = body as { photoUrl: string };

  if (!photoUrl) return errorResponse("photoUrl richiesto");

  const report = await prisma.maintenanceReport.findUnique({ where: { id } });
  if (!report) return errorResponse("Segnalazione non trovata", 404);

  // Check max 5 photos
  const count = await prisma.reportPhoto.count({ where: { report_id: id } });
  if (count >= 5) return errorResponse("Massimo 5 foto per segnalazione");

  const photo = await prisma.reportPhoto.create({
    data: { report_id: id, photo_url: photoUrl },
  });

  return json(photo, 201);
}
