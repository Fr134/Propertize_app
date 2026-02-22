-- CreateTable
CREATE TABLE "property_supply_stocks" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "supply_item_id" UUID NOT NULL,
    "qty_current" INTEGER NOT NULL DEFAULT 0,
    "qty_standard" INTEGER NOT NULL DEFAULT 1,
    "low_threshold" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_task" UUID,

    CONSTRAINT "property_supply_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_supply_stocks_property_id_supply_item_id_key" ON "property_supply_stocks"("property_id", "supply_item_id");

-- AddForeignKey
ALTER TABLE "property_supply_stocks" ADD CONSTRAINT "property_supply_stocks_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_supply_stocks" ADD CONSTRAINT "property_supply_stocks_supply_item_id_fkey" FOREIGN KEY ("supply_item_id") REFERENCES "supply_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
