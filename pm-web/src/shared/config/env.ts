export const env = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  AGENT_BASE_URL: process.env.NEXT_PUBLIC_AGENT_BASE_URL || 'http://localhost:8083',
} as const;
