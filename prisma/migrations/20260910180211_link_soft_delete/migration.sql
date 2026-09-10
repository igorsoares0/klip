-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Link_workspaceId_createdAt_idx" ON "Link"("workspaceId", "createdAt");
