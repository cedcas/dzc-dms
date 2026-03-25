-- CreateTable
CREATE TABLE `documents` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `storagePath` VARCHAR(191) NOT NULL,
    `category` ENUM('INTAKE', 'STATEMENT', 'HARDSHIP', 'SETTLEMENT_AGREEMENT', 'PROOF_OF_PAYMENT', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `notes` TEXT NULL,
    `clientId` VARCHAR(191) NULL,
    `debtAccountId` VARCHAR(191) NULL,
    `uploadedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `documents_clientId_idx`(`clientId`),
    INDEX `documents_debtAccountId_idx`(`debtAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_debtAccountId_fkey` FOREIGN KEY (`debtAccountId`) REFERENCES `debt_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
