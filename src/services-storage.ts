import { eventFields, mails, scenarios, troubles } from "./services-data";
export const servicesKey = "gemini-toranomaki:services:v1";
export interface ServicesProgress {
  step: number;
  mail: string;
  prediction: number | null;
  adoption: number | null;
  extraction: Record<string, number>;
  scenario: string;
  troubles: Record<string, number>;
  simulated: boolean;
  copied: string[];
  tried: boolean;
  calendarChecked: boolean;
}
export function sanitizeServices(raw: unknown): ServicesProgress {
  const r =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const answers = (value: unknown, limits: Record<string, number>) => {
    const result: Record<string, number> = {};
    if (value && typeof value === "object")
      for (const [key, n] of Object.entries(value))
        if (
          Object.hasOwn(limits, key) &&
          typeof n === "number" &&
          Number.isInteger(n) &&
          n >= 0 &&
          n < limits[key]
        )
          result[key] = n;
    return result;
  };
  return {
    step:
      typeof r.step === "number" &&
      Number.isInteger(r.step) &&
      r.step >= 0 &&
      r.step < 4
        ? r.step
        : 0,
    mail: mails.some((m) => m.id === r.mail) ? (r.mail as string) : "original",
    prediction: r.prediction === 0 || r.prediction === 1 ? r.prediction : null,
    adoption:
      r.adoption === 0 || r.adoption === 1 || r.adoption === 2
        ? r.adoption
        : null,
    extraction: answers(
      r.extraction,
      Object.fromEntries(eventFields.map((f) => [f.id, f.options.length])),
    ),
    scenario: scenarios.some((s) => s.id === r.scenario)
      ? (r.scenario as string)
      : "old",
    troubles: answers(
      r.troubles,
      Object.fromEntries(troubles.map((t, i) => [String(i), t.options.length])),
    ),
    simulated: r.simulated === true,
    copied: Array.isArray(r.copied)
      ? [
          ...new Set(
            r.copied.filter((v): v is string =>
              [
                "mock-search",
                "mock-registration",
                "real-search",
                "real-registration",
                "real-preflight",
                "real-execution",
              ].includes(v),
            ),
          ),
        ]
      : [],
    tried: r.tried === true,
    calendarChecked: r.calendarChecked === true,
  };
}
export function loadServices() {
  try {
    return {
      progress: sanitizeServices(
        JSON.parse(localStorage.getItem(servicesKey) || "{}"),
      ),
      available: true,
    };
  } catch {
    return { progress: sanitizeServices(null), available: false };
  }
}
export function saveServices(progress: ServicesProgress) {
  try {
    localStorage.setItem(
      servicesKey,
      JSON.stringify(sanitizeServices(progress)),
    );
    return true;
  } catch {
    return false;
  }
}
