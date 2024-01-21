
# OpenAI Helpers

## Description

This repository contains a Node.js module that facilitates interaction with the OpenAI API. It provides a range of functionalities, including running queries, transcribing audio, managing messages in threads, and getting responses from OpenAI's models. The library utilizes `openai`, `bluebird`, and `debug` npm packages to handle API requests, promises, and debugging, respectively.

## Key Features

1. **Run Query**: Supports running queries in threads with the OpenAI API, handling both existing and new threads.
2. **Transcribe**: Functionality for transcribing audio files using OpenAI's transcription models.
3. **Get Answer**: Fetches responses from OpenAI's chat models.
4. **Thread Message Management**: Functions to handle and retrieve messages within a thread.
5. **Run Observations**: Observe and manage the status of ongoing runs in a thread.
6. **Cancel Run**: Ability to cancel ongoing runs within a thread.
7. **Error and Status Handling**: Provides comprehensive error and status handling during interactions with the OpenAI API.

## Installation

To use this library, you'll need to have Node.js installed on your system. Clone this repository and install the required dependencies using npm:

```bash
npm install
```

## Usage

To use the functions provided by this library, require it in your Node.js application:

```javascript
const { runQuery, transcribe, getAnswer, cancelRun, observeRun, lastThreadMessages } = require('path-to-library');
```

Ensure that your OpenAI API key is set in your environment variables as `OPENAI_API_KEY`.

## Examples

*Example usage of the `transcribe` function:*

```javascript
const audioBuffer = ...; // Your audio data here
transcribe(audioBuffer).then(transcription => {
  console.log(transcription);
});
```

*Example usage of the `getAnswer` function:*

```javascript
const query = "What is the capital of France?";
getAnswer(query).then(answer => {
  console.log(answer);
});
```

## Contributing

Feel free to fork this repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
