import { z } from 'zod'
import { Api, invokable } from '../src/apis'
import { Calculator } from '../src/apis/calculator'
import { FactApi } from '../src/apis/fact'
import { OpenpmApi } from '../src/apis/openpm'
import {OpenApi} from '../src/apis/openapi/openapi'
import { OpenAiAgent } from '../src/chat-agents/open-ai'
import { WorkGptRunner } from '../src/runners/workgpt'
import { haltProgram } from '../src/runners/control'
import {AzureOpenAiAgent} from "../src/chat-agents/azure-open-ai";
import * as yaml from 'js-yaml';
import * as fs from 'fs';

export class WorkGptControl extends Api {
  @invokable({
    usage:
      'Finishes the program. Call when you have an answer, or you have finished the task you were given.',
    schema: z.object({
      song: z.string(),
    }),
  })
  onFinish(result: { song: string; }) {
    haltProgram(result)
  }
}

async function main() {

  const fileContents = fs.readFileSync('/Users/keshavgupta/Code/quantive/workgpt/openapi-yml/fixed-spotify-open-api.yml', 'utf8');
  const data : any = yaml.load(fileContents);  
  
  const agent = new OpenAiAgent({
    verbose: true,
    temperature: 0.1,
  })

  const apis = await Promise.all([
    OpenApi.fromDocument(data, {
        authKey: process.env.SPOTIFY_API_KEY!,
      }),
    new Calculator(),
    new FactApi(),
  ])

  const runner = new WorkGptRunner({
    agent,
    apis,
  })

  const result = await runner.runWithDirective(
    'What is the most played song by coldplay'
  )

  console.log('Result', result)
}

main()
