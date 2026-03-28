/**
 * Minimal HubSpot entity types needed for lead-to-client conversion.
 * Extend these as the integration grows.
 */

export interface HubSpotContact {
  id: string
  properties: {
    firstname?: string
    lastname?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    hs_lead_status?: string
    notes_last_contacted?: string
  }
}

export interface HubSpotDeal {
  id: string
  properties: {
    dealname?: string
    dealstage?: string
    amount?: string
    closedate?: string
  }
}

/** Payload passed to the conversion service */
export interface LeadConversionPayload {
  contact: HubSpotContact
  deal?: HubSpotDeal
  /** DMS user ID to assign as handler */
  handlerId?: string
}
