-- CreateTable
CREATE TABLE "makes" (
    "make_id" INTEGER NOT NULL,
    "make_name" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "makes_pkey" PRIMARY KEY ("make_id")
);

-- CreateTable
CREATE TABLE "vehicle_types" (
    "type_id" INTEGER NOT NULL,
    "type_name" TEXT NOT NULL,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("type_id")
);

-- CreateTable
CREATE TABLE "make_vehicle_types" (
    "make_id" INTEGER NOT NULL,
    "vehicle_type_id" INTEGER NOT NULL,

    CONSTRAINT "make_vehicle_types_pkey" PRIMARY KEY ("make_id","vehicle_type_id")
);

-- CreateIndex
CREATE INDEX "makes_make_name_idx" ON "makes"("make_name");

-- AddForeignKey
ALTER TABLE "make_vehicle_types" ADD CONSTRAINT "make_vehicle_types_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "makes"("make_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "make_vehicle_types" ADD CONSTRAINT "make_vehicle_types_vehicle_type_id_fkey" FOREIGN KEY ("vehicle_type_id") REFERENCES "vehicle_types"("type_id") ON DELETE CASCADE ON UPDATE CASCADE;
