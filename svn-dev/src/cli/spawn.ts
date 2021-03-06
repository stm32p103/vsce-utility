import { decodeStream } from 'iconv-lite';
import { spawn, SpawnOptions } from 'child_process';

export interface SpawnResult {
  code: number;
  stdout: string;
  stderr: string;
}

type AsyncSpawnOption = SpawnOptions & { encoding?: string };

/**
 * child_process.spawnを実行し、終了コードとstdout, stderrの内容をstringとして返す。
 * @param encoding stdout, stderrの文字コード([iconv-lite](https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings)対応している文字コードより選択)
 * @param command コマンド(spawnと同様)
 * @param args 引数(spawnと同様)
 * @param options オプション(spawnと同様)
 * @returns 終了コード, stdout, stderrの出力
 */
export async function asyncSpawn( command: string, args: string[] = [], options: AsyncSpawnOption ) {
  const childProcess = spawn( command, args, options );
  const stdout: string[] = [];
  const stderr: string[] = [];

  const encoding = options.encoding || 'utf8';
  childProcess.stdout.pipe( decodeStream( encoding ) ).on( 'data', ( line: string ) => stdout.push( line ) );
  childProcess.stderr.pipe( decodeStream( encoding ) ).on( 'data', ( line: string ) => stderr.push( line ) );

  return new Promise<SpawnResult>( ( resolve, reject ) => {
    childProcess.on( 'close', code => {
      const result = { 
        code: code,
        stdout: stdout.join(''),
        stderr: stderr.join('')
      };
      
      // 終了コード非0の時は異常終了のためRejectする
      if( code == 0 ) {
        resolve( result );
      } else {
        reject( result );
      }
    } )
  } );
}
