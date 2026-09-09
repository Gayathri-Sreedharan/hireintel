const supabase = require("../config/supabase");


/**
 * Find hiring partners associated with a company.
 */
async function findHiringPartnersByCompany(companyId) {
  if (!companyId) return [];

  const { data, error } = await supabase
    .from("hiring_partners")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Error finding hiring partners: ${error.message}`
    );
  }

  return data || [];
}


/**
 * Find a hiring partner by email.
 */
async function findHiringPartnerByEmail(email) {
  if (!email) return null;

  const { data, error } = await supabase
    .from("hiring_partners")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error finding hiring partner by email: ${error.message}`
    );
  }

  return data;
}


/**
 * Create a hiring partner.
 */
async function createHiringPartner(partnerData) {
  if (!partnerData?.name && !partnerData?.email) {
    throw new Error(
      "Hiring partner must have at least a name or email"
    );
  }

  const payload = {
    company_id: partnerData.company_id || null,

    name: partnerData.name || null,
    designation: partnerData.designation || null,

    email: partnerData.email
      ? partnerData.email.trim().toLowerCase()
      : null,

    phone: partnerData.phone || null,

    linkedin_url: partnerData.linkedin_url || null,
    profile_url: partnerData.profile_url || null,

    source: partnerData.source || null,

    confidence: partnerData.confidence || "unknown",

    is_verified: partnerData.is_verified || false
  };

  const { data, error } = await supabase
    .from("hiring_partners")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Error creating hiring partner: ${error.message}`
    );
  }

  return data;
}


/**
 * Find an existing hiring partner or create one.
 */
async function findOrCreateHiringPartner(partnerData) {
  if (!partnerData) return null;

  if (partnerData.email) {
    const existing = await findHiringPartnerByEmail(
      partnerData.email
    );

    if (existing) {
      return existing;
    }
  }

  return createHiringPartner(partnerData);
}


/**
 * Update a hiring partner.
 */
async function updateHiringPartner(partnerId, updates) {
  if (!partnerId) {
    throw new Error("Hiring partner ID is required");
  }

  const { data, error } = await supabase
    .from("hiring_partners")
    .update(updates)
    .eq("id", partnerId)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Error updating hiring partner: ${error.message}`
    );
  }

  return data;
}


module.exports = {
  findHiringPartnersByCompany,
  findHiringPartnerByEmail,
  createHiringPartner,
  findOrCreateHiringPartner,
  updateHiringPartner
};
