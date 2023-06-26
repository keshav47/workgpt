import { assertString } from '../../lib/assert'


export async function fetchApi<T>(
  path: string,
  {
    method,
    body,
    apiKey = getApiKey(),
  }: {
    method?: 'GET' | 'POST'
    body?: Record<string, unknown>
    apiKey?: string
  }
): Promise<T> {
  assertString(apiKey, 'No AzureOpenAPI API Key provided')
  const response = await fetch(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "api-key": `${apiKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
  })

  if (!response.ok) {
    throw new Error(
      `AzureOpenAI API responded with ${response.status}: ${await response.text()}}`
    )
  }

  const json = await response.json()
  return json as T
}

function getApiKey(): string | undefined {
  if (typeof process !== 'undefined') {
    return process.env?.AZURE_OPENAI_API_KEY
  }
}
