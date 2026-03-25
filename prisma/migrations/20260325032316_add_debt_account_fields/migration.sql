-- DropForeignKey
ALTER TABLE `debt_accounts` DROP FOREIGN KEY `debt_accounts_creditorId_fkey`;

-- AlterTable
ALTER TABLE `debt_accounts` ADD COLUMN `delinquencyStage` ENUM('CURRENT', 'LATE_30', 'LATE_60', 'LATE_90', 'LATE_120', 'LATE_180_PLUS', 'CHARGED_OFF') NULL,
    ADD COLUMN `lastContactDate` DATETIME(3) NULL,
    ADD COLUMN `nextFollowUpDate` DATETIME(3) NULL,
    ADD COLUMN `originalCreditorName` VARCHAR(191) NULL,
    MODIFY `creditorId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `debt_accounts` ADD CONSTRAINT `debt_accounts_creditorId_fkey` FOREIGN KEY (`creditorId`) REFERENCES `creditors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
