const supabase = require("../config/supabase");

/**
 * Normalize a company name for matching/deduplication.
 */
function normalizeCompanyName(name) {
  if (!name) return null;

  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}


/**
 * Find a company using its normalized name.
 */
async function findCompany(name) {
  if (!name) return null;

  const normalizedName = normalizeCompanyName(name);

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (error) {
    throw new Error(`Error finding company: ${error.message}`);
  }

  return data;
}


/**
 * Create a new company.
 */
async function createCompany(companyData) {
  if (!companyData?.name) {
    throw new Error("Company name is required");
  }

  const normalizedName =
    companyData.normalized_name ||
    normalizeCompanyName(companyData.name);

  const payload = {
    name: companyData.name.trim(),
    normalized_name: normalizedName,

    website: companyData.website || null,
    linkedin_url: companyData.linkedin_url || null,

    industry: companyData.industry || null,
    company_size: companyData.company_size || null,
    headquarters: companyData.headquarters || null,

    description: companyData.description || null,

    hiring_status: companyData.hiring_status || "unknown"
  };

  const { data, error } = await supabase
    .from("companies")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating company: ${error.message}`);
  }

  return data;
}


/**
 * Find an existing company or create it if it doesn't exist.
 */
async function findOrCreateCompany(companyData) {
  if (!companyData?.name) {
    return null;
  }

  const existing = await findCompany(companyData.name);

  if (existing) {
    return existing;
  }

  return createCompany(companyData);
}


/**
 * Update company information.
 */
async function updateCompany(companyId, updates) {
  if (!companyId) {
    throw new Error("Company ID is required");
  }

  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating company: ${error.message}`);
  }

  return data;
}


module.exports = {
  normalizeCompanyName,
  findCompany,
  createCompany,
  findOrCreateCompany,
  updateCompany
};
