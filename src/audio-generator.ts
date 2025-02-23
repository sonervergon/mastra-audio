import { ElevenLabsClient } from "elevenlabs";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

const voiceId = "1SM7GgM6IMuvQlz2BwM3";

export const createAudioFileFromText = async (
  text: string
): Promise<string> => {
  try {
    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
    });

    const fileName = `${Date.now()}.mp3`;
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    await Bun.write(fileName, audioBuffer);
    return fileName;
  } catch (error) {
    throw error;
  }
};
