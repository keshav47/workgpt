import { assert } from '../../lib/assert'
import { ChatAgent } from '../base'
import { logChatFunction, logChatMessage } from '../logger'
import { ChatFunction, ChatMessage, ChatResponse } from '../types'
import { fetchApi } from './client'
import { OpenAIChatCompletion } from './types'

const AZURE_OPENAI_ENDPOINT = "quantive-plus-openai-staging"

export interface AzureOpenApiAgentOptions {
  model?: 'gpt-35-turbo'
  api_version?: '2023-03-15-preview' | '2022-12-01' | '2023-05-15' | '2023-06-01-preview'
  apiKey?: string
  max_tokens?: number
  temperature?: number
  frequency_penalty?: number
  presence_penalty?: number 
  top_p?: number 
  verbose?: boolean
}

export class AzureOpenAiAgent extends ChatAgent {
  model: string
  api_version: string
  max_tokens: number
  temperature: number
  frequency_penalty: number 
  presence_penalty: number
  apiKey: string | undefined


  constructor({
    model = "gpt-35-turbo",
    api_version = "2023-03-15-preview",
    max_tokens = 1000,
    temperature = 0,
    frequency_penalty = 0.0,
    presence_penalty = 0.0,
    apiKey,
    verbose = false,
  }: AzureOpenApiAgentOptions = {}) {
    super({ verbose })
    this.model = model
    this.api_version = api_version
    this.max_tokens = max_tokens
    this.temperature = temperature
    this.frequency_penalty = frequency_penalty
    this.presence_penalty = presence_penalty
    this.apiKey = apiKey
  }

  async call({
    messages,
    functions,
    functionCall,
  }: {
    messages: ChatMessage[]
    functions?: ChatFunction[]
    functionCall?: string
  }): Promise<ChatResponse> {
    this.onRequest({ messages, functions })

    const response = await fetchApi<OpenAIChatCompletion>(`https://${AZURE_OPENAI_ENDPOINT}.openai.azure.com/openai/deployments/${this.model}/chat/completions?api-version=${this.api_version}`, {
      method: 'POST',
      body: {
        messages,
        max_tokens: this.max_tokens,
        temperature: this.temperature,
        frequency_penalty: this.frequency_penalty,
        presence_penalty: this.presence_penalty,
        // functions,
        // function_call: functionCall ? { name: functionCall } : undefined,
      },
      apiKey: this.apiKey,
    })

    assert(response.choices.length === 1, 'Expected response.choices to be 1')

    const [choice] = response.choices

    this.onResponse(choice.message)

    return choice.message
  }

  protected onRequest({
    messages,
    functions,
  }: {
    messages: ChatMessage[]
    functions?: ChatFunction[]
  }) {
    this.log({ direction: 'outgoing', messages, functions })
  }

  protected onResponse(message: ChatResponse) {
    this.log({ direction: 'incoming', messages: [message] })
  }

  protected log({
    direction,
    messages,
    functions,
  }: {
    direction: 'incoming' | 'outgoing'
    messages: ChatMessage[]
    functions?: ChatFunction[]
  }) {
    if (!this.verbose) {
      return
    }

    functions?.forEach(logChatFunction.bind(null, direction))
    messages.forEach(logChatMessage.bind(null, direction))
  }
}
