import { XMLParser } from "fast-xml-parser";
import { Grant } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  processEntities: false,
  isArray: (name) => {
    // These elements are always arrays (grant lists)
    const arrayElements = [
      "RecipientTable",
      "GrantOrContributionPdDurYrGrp",
      "GrantOrContributionPaidDuringYear",
      "GrantOrContriApprvForFutGrp",
      "GrantOrContriPaidDurYrGrp",
    ];
    return arrayElements.includes(name);
  },
});

function getNestedValue(obj: unknown, ...paths: string[]): unknown {
  for (const path of paths) {
    let current: unknown = obj;
    for (const key of path.split(".")) {
      if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[key];
      } else {
        current = undefined;
        break;
      }
    }
    if (current !== undefined) return current;
  }
  return undefined;
}

function extractName(grantEntry: Record<string, unknown>): string {
  // Try multiple known paths for recipient name
  const name = getNestedValue(
    grantEntry,
    "RecipientBusinessName.BusinessNameLine1Txt",
    "RecipientBusinessName.BusinessNameLine1",
    "RecipientNameBusiness.BusinessNameLine1Txt",
    "RecipientNameBusiness.BusinessNameLine1",
    "RecipientPersonNm",
    "RecipientPersonName"
  );
  return typeof name === "string" ? name.trim() : "Unknown Recipient";
}

function extractAmount(grantEntry: Record<string, unknown>): number {
  const amt = getNestedValue(
    grantEntry,
    "CashGrantAmt",
    "Amt",
    "CashGrantAmount",
    "AmountOfCashGrant",
    "NonCashAssistanceAmt",
    "AmountOfNonCashAssistance"
  );
  return typeof amt === "number" ? amt : typeof amt === "string" ? parseInt(amt, 10) || 0 : 0;
}

function extractPurpose(grantEntry: Record<string, unknown>): string {
  const purpose = getNestedValue(
    grantEntry,
    "PurposeOfGrantTxt",
    "PurposeOfGrant",
    "GrantOrContributionPurposeTxt",
    "PurposeOfGrantOrContribution"
  );
  return typeof purpose === "string" ? purpose.trim() : "";
}

function extractEin(grantEntry: Record<string, unknown>): string | undefined {
  const ein = getNestedValue(grantEntry, "RecipientEIN", "EINOfRecipient");
  if (typeof ein === "number") return String(ein);
  if (typeof ein === "string" && ein.length > 0) return ein;
  return undefined;
}

function extractState(grantEntry: Record<string, unknown>): string | undefined {
  const state = getNestedValue(
    grantEntry,
    "USAddress.StateAbbreviationCd",
    "RecipientUSAddress.StateAbbreviationCd",
    "AddressUS.StateAbbreviationCd",
    "USAddress.State",
    "RecipientUSAddress.State"
  );
  return typeof state === "string" ? state : undefined;
}

function extractCity(grantEntry: Record<string, unknown>): string | undefined {
  const city = getNestedValue(
    grantEntry,
    "USAddress.CityNm",
    "RecipientUSAddress.CityNm",
    "AddressUS.CityNm",
    "USAddress.City",
    "RecipientUSAddress.City"
  );
  return typeof city === "string" ? city : undefined;
}

function normalizeToArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseXmlGrants(xmlContent: string, formType: number): Grant[] {
  try {
    const parsed = parser.parse(xmlContent);
    const returnData = getNestedValue(parsed, "Return.ReturnData") as Record<string, unknown> | undefined;

    if (!returnData) return [];

    if (formType === 2) {
      return parse990PFGrants(returnData);
    } else {
      return parse990ScheduleIGrants(returnData);
    }
  } catch (e) {
    console.error("XML parsing error:", e);
    return [];
  }
}

function parse990ScheduleIGrants(returnData: Record<string, unknown>): Grant[] {
  // Try multiple paths for Schedule I grant data
  const grantPaths = [
    "IRS990ScheduleI.RecipientTable",
    "IRS990ScheduleI.GrantsOtherAsstToOrgsInUS",
    "IRS990ScheduleI.GrantsOtherAsstToIndivInUS",
  ];

  const grants: Grant[] = [];

  for (const path of grantPaths) {
    const grantData = getNestedValue(returnData, path);
    const grantArray = normalizeToArray(grantData as Record<string, unknown>[]);

    for (const entry of grantArray) {
      if (!entry || typeof entry !== "object") continue;
      const amount = extractAmount(entry);
      if (amount <= 0) continue;

      grants.push({
        recipientName: extractName(entry),
        recipientEin: extractEin(entry),
        amount,
        purposeText: extractPurpose(entry),
        recipientState: extractState(entry),
        recipientCity: extractCity(entry),
      });
    }
  }

  return grants;
}

function parse990PFGrants(returnData: Record<string, unknown>): Grant[] {
  // 990-PF grants are in SupplementaryInformationGrp or older paths
  const grantPaths = [
    "IRS990PF.SupplementaryInformationGrp.GrantOrContributionPdDurYrGrp",
    "IRS990PF.SupplementaryInformationGrp.GrantOrContriPaidDurYrGrp",
    "IRS990PF.SupplementaryInformation.GrantOrContributionPaidDuringYear",
    // Some 990-PFs use a different structure
    "IRS990PF.GrantOrContributionPdDurYrGrp",
  ];

  const grants: Grant[] = [];

  for (const path of grantPaths) {
    const grantData = getNestedValue(returnData, path);
    const grantArray = normalizeToArray(grantData as Record<string, unknown>[]);

    for (const entry of grantArray) {
      if (!entry || typeof entry !== "object") continue;
      const amount = extractAmount(entry);
      if (amount <= 0) continue;

      grants.push({
        recipientName: extractName(entry),
        recipientEin: extractEin(entry),
        amount,
        purposeText: extractPurpose(entry),
        recipientState: extractState(entry),
        recipientCity: extractCity(entry),
      });
    }

    if (grants.length > 0) break; // Found grants, stop trying other paths
  }

  return grants;
}
