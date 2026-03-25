-- AlterTable
ALTER TABLE `offers` ADD COLUMN `installmentCount` INTEGER NULL,
    ADD COLUMN `installmentFreq` VARCHAR(191) NULL,
    ADD COLUMN `paymentType` ENUM('LUMP_SUM', 'INSTALLMENT') NOT NULL DEFAULT 'LUMP_SUM',
    ADD COLUMN `percentOfBalance` DECIMAL(5, 2) NULL,
    ADD COLUMN `source` VARCHAR(191) NULL;
