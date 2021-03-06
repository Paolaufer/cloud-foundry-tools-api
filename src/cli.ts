/*
 * SPDX-FileCopyrightText: 2020 SAP SE or an SAP affiliate company <alexander.gilin@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpawnOptions, spawn } from 'child_process';
import { parse } from "comment-json";
import * as _ from "lodash";
import { CliResult, CF_CMD_EXIT_CODE, CancellationToken } from './types';

export class Cli {
    public static execute(args?: string[], options?: SpawnOptions, token?: CancellationToken): Promise<CliResult> {
        token = token || { isCancellationRequested: false, onCancellationRequested: () => { return; } };
        Cli.updateSpawnOptions(options);

        return new Promise<CliResult>(resolve => {
            let stderr = "";
            let stdout = "";

            if (token.isCancellationRequested) {
                Cli.cliResultOnExit(stdout, resolve, stderr, CF_CMD_EXIT_CODE.CANCEL_REQ);
                return;
            }
            const childProcess = spawn(Cli.CF_CMD, args, options);

            childProcess.stdin.end();

            childProcess.stdout.on('data', (data: string) => {
                stdout = stdout.concat(data);
            });

            childProcess.stderr.on('data', (data: string) => {
                stderr = stderr.concat(data);
            });

            childProcess.on('exit', (code: number) => {
                Cli.cliResultOnExit(stdout, resolve, stderr, code);
            });

            childProcess.on('error', (err: any) => {
                const message = (err.code === "ENOENT") ? `${Cli.CF_CMD}: command not found` : err.message;
                resolve({ "stdout": stdout, "stderr": stderr, error: message, exitCode: CF_CMD_EXIT_CODE.ERROR });
            });

            token.onCancellationRequested(() => {
                childProcess.kill();
                Cli.cliResultOnExit("", resolve, "", CF_CMD_EXIT_CODE.CANCELED);
            });
        });

    }

    private static readonly CF_LOGIN_ERROR = "Not logged in. Use 'cf login' to log in.";
    private static readonly CF_CMD = "cf";

    private static cliResultOnExit(stdout: string, resolve: (value?: CliResult | PromiseLike<CliResult>) => void, stderr: string, code: number) {
        if (stdout) {
            if (stdout.indexOf("error_code") > 0) {
                try {
                    const cfErr = parse(stdout);
                    const message = (_.get(cfErr, 'code') === 10002) ? Cli.CF_LOGIN_ERROR : _.get(cfErr, 'description', 'Internal error occured');
                    resolve({ "stdout": stdout, "stderr": stderr, exitCode: CF_CMD_EXIT_CODE.ERROR, error: message });
                    return;
                }
                catch (e) {
                    // ignore, as probably not an error
                }
            }
            else if (stdout.startsWith("FAILED") && stdout.indexOf("Error creating request") > 0) {
                // most probably not logged in
                resolve({ "stdout": stdout, "stderr": stderr, error: Cli.CF_LOGIN_ERROR, exitCode: CF_CMD_EXIT_CODE.ERROR });
                return;
            } else if (stdout.includes('failed') && stdout.includes('Error:')) {
                // Jira: https://sapjira.wdf.sap.corp/browse/DEVXBUGS-5660
                resolve({ "stdout": stdout, "stderr": stderr, error: stdout, exitCode: CF_CMD_EXIT_CODE.ERROR });
                return;
            } else if (stdout.startsWith('FAILED') && stdout.indexOf("No API endpoint set") > 0) {
                // Jira: https://sapjira.wdf.sap.corp/browse/DEVXBUGS-6488
                resolve({ "stdout": stdout, "stderr": stderr, error: stdout, exitCode: CF_CMD_EXIT_CODE.ERROR });
                return;
            }
        }
        resolve({ "stdout": stdout, "stderr": stderr, exitCode: code });
    }

    private static updateSpawnOptions(options: SpawnOptions) {
        if (options) {
            options.env = {
                ...process.env,
                NODE_VERSION: process.versions.node,
                ...options.env,
            };
            _.defaults(options, { cwd: _.get(options, "cmd", __dirname) });
        }
    }

}
