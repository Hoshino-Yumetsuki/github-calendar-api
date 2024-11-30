import esbuild from 'esbuild'

const options = {
    entryPoints: ['./src/index.ts'],
    bundle: true,
    outdir: 'dist',
    minify: true,
    format: 'esm',
    target: 'es2022',
    platform: 'browser',
    packages: 'external',
}

await esbuild.build(options)