/**
 * HubSpot API client stub.
 * Replace the fetch calls with @hubspot/api-client when the integration is built.
 * Requires env vars: HUBSPOT_ACCESS_TOKEN
 */

import type { HubSpotContact, HubSpotDeal } from './types'

const BASE = 'https://api.hubapi.com'

function headers() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN is not set')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function getContact(contactId: string): Promise<HubSpotContact> {
  const res = await fetch(
    `${BASE}/crm/v3/objects/contacts/${contactId}?properties=firstname,lastname,email,phone,address,city,state,zip,hs_lead_status`,
    { headers: headers() }
  )
  if (!res.ok) throw new Error(`HubSpot getContact failed: ${res.status}`)
  return res.json()
}

export async function getDeal(dealId: string): Promise<HubSpotDeal> {
  const res = await fetch(
    `${BASE}/crm/v3/objects/deals/${dealId}?properties=dealname,dealstage,amount,closedate`,
    { headers: headers() }
  )
  if (!res.ok) throw new Error(`HubSpot getDeal failed: ${res.status}`)
  return res.json()
}
