import { EventEmitter } from 'node:events';
import { createReadStream } from 'node:fs';
import { FileReader } from './file-reader.interface.js';
import { FileParser } from '../file-parser/index.js';

export class TSVFileReader extends EventEmitter implements FileReader {
  private CHUNK_SIZE = 16384; // 16KB

  constructor(
    private readonly filename: string,
    private readonly fileParser: FileParser,
  ) {
    super();
  }

  public async read(): Promise<void> {
    const readStream = createReadStream(this.filename, {
      highWaterMark: this.CHUNK_SIZE,
      encoding: 'utf-8',
    });

    let remainingData = '';
    let nextLinePosition = -1;
    let importedRowCount = 0;

    for await (const chunk of readStream) {
      remainingData += chunk.toString();

      while ((nextLinePosition = remainingData.indexOf('\n')) >= 0) {
        const completeRow = remainingData.slice(0, nextLinePosition + 1);
        remainingData = remainingData.slice(++nextLinePosition);
        importedRowCount += 1;

        const parsedLine = this.fileParser.parseLine(completeRow);
        this.emit('line', parsedLine);
      }
    }

    this.emit('end', importedRowCount);
  }
}
