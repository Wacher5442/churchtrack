-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PASTOR');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "app_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "submission_window_days" INTEGER NOT NULL DEFAULT 6,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" BIGINT,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churches" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "location" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pastor_churches" (
    "id" BIGSERIAL NOT NULL,
    "pastor_id" BIGINT NOT NULL,
    "church_id" BIGINT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pastor_churches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" BIGSERIAL NOT NULL,
    "church_id" BIGINT NOT NULL,
    "week_start" DATE NOT NULL,
    "week_end" DATE NOT NULL,
    "attendance" INTEGER NOT NULL DEFAULT 0,
    "newcomers" INTEGER NOT NULL DEFAULT 0,
    "salvation_decisions" INTEGER NOT NULL DEFAULT 0,
    "church_integration" INTEGER NOT NULL DEFAULT 0,
    "tribe_integration" INTEGER NOT NULL DEFAULT 0,
    "servants" INTEGER NOT NULL DEFAULT 0,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_by" BIGINT,
    "submitted_at" TIMESTAMP(3),
    "period_unlocked_by" BIGINT,
    "period_unlocked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "report_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "pastor_churches_pastor_id_is_active_idx" ON "pastor_churches"("pastor_id", "is_active");

-- CreateIndex
CREATE INDEX "pastor_churches_church_id_is_primary_idx" ON "pastor_churches"("church_id", "is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "pastor_churches_pastor_id_church_id_key" ON "pastor_churches"("pastor_id", "church_id");

-- CreateIndex
CREATE INDEX "weekly_reports_church_id_week_start_idx" ON "weekly_reports"("church_id", "week_start");

-- CreateIndex
CREATE INDEX "weekly_reports_status_idx" ON "weekly_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_church_id_week_start_key" ON "weekly_reports"("church_id", "week_start");

-- CreateIndex
CREATE INDEX "report_audit_logs_report_id_idx" ON "report_audit_logs"("report_id");

-- AddForeignKey
ALTER TABLE "app_config" ADD CONSTRAINT "app_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastor_churches" ADD CONSTRAINT "pastor_churches_pastor_id_fkey" FOREIGN KEY ("pastor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastor_churches" ADD CONSTRAINT "pastor_churches_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_period_unlocked_by_fkey" FOREIGN KEY ("period_unlocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_audit_logs" ADD CONSTRAINT "report_audit_logs_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "weekly_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_audit_logs" ADD CONSTRAINT "report_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
