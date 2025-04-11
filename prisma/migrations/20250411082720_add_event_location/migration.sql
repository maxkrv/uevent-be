/*
  Warnings:

  - You are about to drop the column `location` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `location_lat` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `location_lng` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "location",
DROP COLUMN "location_lat",
DROP COLUMN "location_lng";

-- CreateTable
CREATE TABLE "event_locations" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "event_id" TEXT NOT NULL,

    CONSTRAINT "event_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_locations_event_id_key" ON "event_locations"("event_id");

-- AddForeignKey
ALTER TABLE "event_locations" ADD CONSTRAINT "event_locations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
