-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "position" DROP NOT NULL,
ALTER COLUMN "position" DROP DEFAULT;
DROP SEQUENCE "tasks_position_seq";
