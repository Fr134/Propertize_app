"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CatalogTab } from "@/components/manager/inventory/catalog-tab";
import { StockTab } from "@/components/manager/inventory/stock-tab";
import { ConsumptionTab } from "@/components/manager/inventory/consumption-tab";
import { OrdersTab } from "@/components/manager/inventory/orders-tab";
import { ForecastTab } from "@/components/manager/inventory/forecast-tab";

const tabs = [
  { key: "catalog", label: "Catalogo" },
  { key: "stock", label: "Magazzino" },
  { key: "consumption", label: "Consumi" },
  { key: "orders", label: "Ordini" },
  { key: "forecast", label: "Previsioni" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function ManagerSuppliesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("catalog");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Scorte &amp; Inventario</h1>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className="rounded-b-none"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "catalog" && <CatalogTab />}
      {activeTab === "stock" && <StockTab />}
      {activeTab === "consumption" && <ConsumptionTab />}
      {activeTab === "orders" && <OrdersTab />}
      {activeTab === "forecast" && <ForecastTab />}
    </div>
  );
}
