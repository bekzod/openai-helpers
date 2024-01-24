const OpenAI = require('openai');
const Promise = require('bluebird');
const debug = require('debug')('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function runQuery(messages, { threadId, assistantId, additionalInstructions } = {}) {
  let run;
  if (threadId) {
    try {
      await Promise.each(messages, async function (val) {
        await createMessage(threadId, val);
      });
    } catch (e) {
      if (e.status === 400) {
        const { data } = await openai.beta.threads.runs.list(
          threadId, { limit: 1 }
        );
        let latestRun = data[0];
        if (latestRun?.status === 'running' || latestRun?.status === 'requires_action') {
          return data[0];
        }
      } else {
        throw e
      }
    }

    run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      additional_instructions: additionalInstructions,
    });
  } else {
    run = await openai.beta.threads.createAndRun({
      assistant_id: assistantId,
      additional_instructions: additionalInstructions,
      thread: {
        messages,
      },
    });
  }

  return run;
}

async function transcribe(buffer) {
  const transcription = await openai.audio.transcriptions.create({
    file: await OpenAI.toFile(buffer, 'speech.mp3'),
    model: 'whisper-1',
  });

  return transcription.text;
}

async function lastThreadMessages(threadId, limit = 4) {
  const { data: messages } = await openai.beta.threads.messages.list(threadId, {
    limit,
  });

  let sent = [];
  let unsent = [];
  messages
    .filter(({ role }) => role === 'assistant')
    .forEach((message) => {
      if (message.metadata.messageId) {
        sent.push(message);
      } else {
        unsent.push(message);
      }
    });

  return { unsent, sent };
}

async function createMessage(threadId, { content, role = 'user', id }) {
  await openai.beta.threads.messages.create(threadId, {
    role,
    content,
    metadata: { messageId: id },
  });
}

async function cancelRun({ id, thread_id }) {
  return await openai.beta.threads.runs.cancel(thread_id, id);
}

async function observeRun({ id, thread_id }) {
  let status = 'in_progress';
  let run;

  let delay = 250;
  const delayDecrement = 75;
  const minDelay = 100;

  while (status === 'in_progress' || status === 'queued') {
    run = await openai.beta.threads.runs.retrieve(thread_id, id);
    await Promise.delay(delay);
    status = run.status;

    // Decrease the delay for the next iteration, but not below the minimum threshold
    delay = Math.max(minDelay, delay - delayDecrement);
  }

  let { usage } = run;

  if (status === 'completed') {
    const threadMessages = await openai.beta.threads.messages.list(thread_id, {
      limit: 1,
    });
    return {
      type: 'text',
      content: threadMessages.data[0].content[0].text.value,
      annotations: threadMessages.data[0].content[0].text.annotations,
      thread_id,
      usage,
      id: threadMessages.data[0].id,
    };
  } else if (status === 'requires_action') {
    let runId = run.id;
    let toolCalls = run.required_action.submit_tool_outputs.tool_calls;

    let submit = async function (outputs) {
      let toolOutputs = outputs.map((output, index) => {
        return {
          tool_call_id: toolCalls[index].id,
          output: output,
        };
      });

      let run = await openai.beta.threads.runs.submitToolOutputs(
        thread_id,
        runId,
        {
          tool_outputs: toolOutputs,
        },
      );

      return run;
    };

    let functionOutputs = toolCalls.map(toolCall => {
      return {
        usage,
        content: JSON.parse(toolCall.function.arguments),
        name: toolCall.function.name
      };
    });

    return { type: 'function', content: functionOutputs, thread_id, submit, usage };
  } else {
    return { type: 'error', thread_id, content: run.last_error?.message, usage };
  }
}


async function getAnswer(messages, args = {}) {
  if (typeof messages === 'string') {
    messages = [{ role: 'system', content: messages }];
  }

  debug('start request');
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    messages,
    // response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 300,
    top_p: 1,
    frequency_penalty: .5,
    presence_penalty: 0,
    ...args,
  });
  debug('end request');
  return response.choices[0].message.content;
}


module.exports = {
  runQuery,
  transcribe,
  getAnswer,
  openai,
  cancelRun,
  observeRun,
  lastThreadMessages
};
