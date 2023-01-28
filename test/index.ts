import path from 'node:path';

import glob from 'glob';
import Mocha from 'mocha';

export function run(testsRoot: string, callback: (error: any, failures?: number) => void): void {
    const mocha = new Mocha({ color: true });

    console.log(testsRoot);

    glob('**/**.test.js', { cwd: testsRoot }, (error, files) => {
        if (error) {
            callback(error);
            return;
        }

        // Add files to the test suite
        for (const f of files) {
            mocha.addFile(path.resolve(testsRoot, f));
        }

        try {
            // Run the mocha test
            mocha.run((failures) => {
                callback(null, failures);
            });
        } catch (error_) {
            callback(error_);
        }
    });
}
