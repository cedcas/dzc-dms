-- AlterTable: extend type enum and add nextActionDate
ALTER TABLE `negotiation_activities`
    MODIFY COLUMN `type` ENUM('CALL', 'VOICEMAIL', 'EMAIL', 'LETTER', 'INTERNAL_NOTE', 'CLIENT_UPDATE', 'SETTLEMENT_DISCUSSION', 'STATUS_CHANGE', 'OFFER_SENT', 'OFFER_RECEIVED') NOT NULL,
    ADD COLUMN `nextActionDate` DATETIME(3) NULL;
