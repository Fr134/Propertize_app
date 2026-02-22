"use client";

import { use } from "react";
import Link from "next/link";
import { usePropertyOperational } from "@/hooks/use-masterfile";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { OperationalTab } from "@/components/manager/masterfile/operational-tab";
import { ContactsTab } from "@/components/manager/masterfile/contacts-tab";
import { CustomFieldsTab } from "@/components/manager/masterfile/custom-fields-tab";
import { InventoryTab } from "@/components/manager/masterfile/inventory-tab";

export default function MasterfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: property } = usePropertyOperational(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/manager/properties/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Masterfile
          </h1>
          {property && (
            <p className="text-sm text-muted-foreground">
              {property.name} ({property.code})
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="operativo">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operativo">Operativo</TabsTrigger>
          <TabsTrigger value="contatti">Contatti</TabsTrigger>
          <TabsTrigger value="custom">Campi Custom</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="operativo" className="mt-6">
          <OperationalTab propertyId={id} />
        </TabsContent>

        <TabsContent value="contatti" className="mt-6">
          <ContactsTab propertyId={id} />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <CustomFieldsTab propertyId={id} />
        </TabsContent>

        <TabsContent value="inventario" className="mt-6">
          <InventoryTab propertyId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
