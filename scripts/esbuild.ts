#!/usr/bin/env tsx

import fs from 'node:fs/promises';
import path from 'node:path';

import type { BuildOptions } from 'esbuild';
import esbuild from 'esbuild';

const options: BuildOptions = {
    entryPoints: ['src/extension.ts'],
    bundle: true,
    metafile: process.argv.includes('--metafile'),
    outdir: './out',
    external: [
        'vscode',
        'typescript', // vue-component-meta
    ],
    format: 'cjs',
    platform: 'node',
    target: 'ESNext',
    tsconfig: './src/tsconfig.json',
    sourcemap: process.argv.includes('--sourcemap'),
    minify: process.argv.includes('--minify'),
    plugins: [
        {
            name: 'umd2esm',
            setup(build) {
                build.onResolve({ filter: /^(vscode-.*|estree-walker|jsonc-parser)/ }, (args) => {
                    const pathUmdMay = require.resolve(args.path, {
                        paths: [args.resolveDir],
                    });
                    // Call twice the replace is to solve the problem of the path in Windows
                    const pathEsm = pathUmdMay
                        .replace('/umd/', '/esm/')
                        .replace('\\umd\\', '\\esm\\');
                    return { path: pathEsm };
                });
            },
        },
        {
            name: 'meta',
            setup(build) {
                build.onEnd(async (result) => {
                    if (result.metafile && result.errors.length === 0) {
                        return fs.writeFile(
                            path.resolve(__dirname, '../meta.json'),
                            JSON.stringify(result.metafile),
                        );
                    }
                });
            },
        },
    ],
};

async function main() {
    const ctx = await esbuild.context(options);
    try {
        if (process.argv.includes('--watch')) {
            await ctx.watch();
        } else {
            await ctx.rebuild();
        }
    } catch (error) {
        console.error(error);
        await ctx.dispose();
        process.exit();
    }

    await ctx.dispose();
}

main();
