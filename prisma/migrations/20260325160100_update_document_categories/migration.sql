-- AlterTable: update DocumentCategory enum values
-- Safe to run while table is empty; update any existing rows to OTHER first.
UPDATE `documents` SET `category` = 'OTHER'
  WHERE `category` NOT IN ('HARDSHIP', 'SETTLEMENT_AGREEMENT', 'OTHER');

ALTER TABLE `documents`
  MODIFY COLUMN `category`
    ENUM('INTAKE', 'STATEMENT', 'HARDSHIP', 'SETTLEMENT_AGREEMENT', 'PROOF_OF_PAYMENT', 'OTHER')
    NOT NULL DEFAULT 'OTHER';
