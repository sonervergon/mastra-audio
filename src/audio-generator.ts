import { ElevenLabsClient } from "elevenlabs";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const MAX_CHUNK_LENGTH = 2500; // ElevenLabs typically has a limit around 2-3k characters

const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

const voiceId = "1SM7GgM6IMuvQlz2BwM3";

// Helper function to split text into chunks
const splitTextIntoChunks = (text: string): string[] => {
  const chunks: string[] = [];
  let currentChunk = "";

  // Split by sentences (rough approximation)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > MAX_CHUNK_LENGTH) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

export const createAudioFileFromText = async (
  text: string
): Promise<string> => {
  try {
    const textChunks = splitTextIntoChunks(text);
    const audioChunks: Buffer[] = [];

    // Process each text chunk
    for (const chunk of textChunks) {
      const audio = await client.textToSpeech.convert(voiceId, {
        text: chunk,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
      });

      const chunks = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }
      audioChunks.push(Buffer.concat(chunks));
    }

    // Combine all audio chunks
    const finalAudioBuffer = Buffer.concat(audioChunks);
    const fileName = `${Date.now()}.mp3`;
    await Bun.write(fileName, finalAudioBuffer);
    return fileName;
  } catch (error) {
    throw error;
  }
};
