/**
 * Lead-to-Client conversion service (stub).
 * Call convertLeadToClient() once the HubSpot integration is enabled.
 */

import { prisma } from '@/lib/db/prisma'
import type { LeadConversionPayload } from './types'

/**
 * Converts a HubSpot lead (Contact + optional Deal) into a DMS Client record.
 * Idempotent: if hubspotContactId already exists, returns the existing client.
 */
export async function convertLeadToClient(payload: LeadConversionPayload) {
  const { contact, deal, handlerId } = payload
  const props = contact.properties

  // Idempotency guard
  const existing = await prisma.client.findUnique({
    where: { hubspotContactId: contact.id },
  })
  if (existing) return existing

  const addressParts = [props.address, props.city, props.state, props.zip].filter(Boolean)

  return prisma.client.create({
    data: {
      firstName:       props.firstname ?? '',
      lastName:        props.lastname ?? '',
      email:           props.email ?? undefined,
      phone:           props.phone ?? undefined,
      address:         addressParts.length ? addressParts.join(', ') : undefined,
      hubspotContactId: contact.id,
      hubspotDealId:   deal?.id ?? undefined,
      hubspotSyncedAt: new Date(),
      handlerId:       handlerId ?? undefined,
      notes: deal?.properties.dealname
        ? `Converted from HubSpot deal: ${deal.properties.dealname}`
        : undefined,
    },
  })
}
