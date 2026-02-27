-- AlterTable: Add Figma snapshot and plugin status fields to Project
ALTER TABLE "Project" ADD COLUMN "figmaSnapshot" JSONB;
ALTER TABLE "Project" ADD COLUMN "figmaSnapshotAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "figmaFileName" TEXT;
ALTER TABLE "Project" ADD COLUMN "pluginLastSeen" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "pluginFigmaFileName" TEXT;
ALTER TABLE "Project" ADD COLUMN "pluginProjectId" TEXT;
