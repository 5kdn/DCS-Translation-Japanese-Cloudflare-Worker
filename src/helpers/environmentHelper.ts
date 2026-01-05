export const getRequiredEnvString = (name: string, v: string | undefined): string => {
  if (!v || !v.trim()) {
    throw new Error(`missing required env: ${name}`);
  }
  return v;
};

export const getRequiredEnvNumber = (name: string, v: string | undefined): number => {
  const s = getRequiredEnvString(name, v);
  const n = Number(s);

  if (!Number.isFinite(n)) {
    throw new Error(`invalid number env: ${name} (value: ${v})`);
  }

  return n;
};

export const getRequiredEnvD1Database = (name: string, v: D1Database | undefined): D1Database => {
  if (!v) {
    throw new Error(`missing required env: ${name}`);
  }
  return v;
};
