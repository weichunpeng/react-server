import cp from 'child_process';
import fs from 'fs';
import path from 'path';
import test from 'ava';
import helpers from 'yeoman-test';
import { defaultOptions } from 'react-server-cli';

test('generator-react-server:app creates default files', async t => {
	let testDir;
	await helpers.run(path.join(__dirname, '../generators/app'))
		.inTmpDir(dir => {
			testDir = dir;
		})
		.withPrompts({name: 'foo', dockerCfg: false})
		.toPromise();
	t.true(await exists('.babelrc', testDir));
	t.true(await exists('.gitignore', testDir));
	t.true(await exists('.reactserverrc', testDir));
	t.true(await exists('components/hello-world.js', testDir));
	t.true(await exists('pages/hello-world.js', testDir));
	t.true(await exists('package.json', testDir));
	t.true(await exists('README.md', testDir));
	t.true(await exists('routes.js', testDir));
	t.false(await exists('Dockerfile', testDir));
	t.false(await exists('docker-compose.yml', testDir));
});

test('generator-react-server:app .reactserverrc matches react-server-cli default option keys', async t => {
	let testDir;
	await helpers.run(path.join(__dirname, '../generators/app'))
		.inTmpDir(dir => {
			testDir = dir;
		})
		.withPrompts({name: 'foo', dockerCfg: false})
		.toPromise();

	// Store cli's default option keys in memory
	const defaultOptionsKeys = Object.keys(defaultOptions);

	// Read .reactserverrc json file generated by the generator
	const reactserverrc = await readFile('.reactserverrc', testDir);

	// Turn string in to object
	const reactserverrcJson = JSON.parse(reactserverrc);

	// Make sure .reactserverrc keys are the same as the cli's default options.
	Object.keys(reactserverrcJson).forEach(key => {
		if (defaultOptionsKeys.indexOf(key) > -1) {
			t.pass(`${key} exists in the cli default options`);
		} else {
			t.fail(`${key} does not exist in the cli default options. Please fix this.`);
		}
	});
});

test('generator-react-server:app creates docker files', async t => {
	let testDir;
	await helpers.run(path.join(__dirname, '../generators/app'))
		.inTmpDir(dir => {
			testDir = dir;
		})
		.withPrompts({name: 'foo', dockerCfg: true})
		.toPromise();
	t.true(await exists('.babelrc', testDir));
	t.true(await exists('.gitignore', testDir));
	t.true(await exists('.reactserverrc', testDir));
	t.true(await exists('components/hello-world.js', testDir));
	t.true(await exists('pages/hello-world.js', testDir));
	t.true(await exists('package.json', testDir));
	t.true(await exists('README.md', testDir));
	t.true(await exists('routes.js', testDir));
	t.true(await exists('Dockerfile', testDir));
	t.true(await exists('docker-compose.yml', testDir));
});

test('generator-react-server:app passes the test target', async t => {
	let testDir;
	await helpers.run(path.join(__dirname, '../generators/app'))
		.inTmpDir(dir => {
			testDir = dir;
		})
		.withPrompts({name: 'foo', dockerCfg: false})
		.toPromise();
	await installDeps();
	t.true(await runsSuccessfully('npm test', testDir));
});

function exists(filename, dir) {
	filename = path.join(dir, filename);
	return new Promise((resolve) => {
		fs.access(filename, fs.F_OK, (err) => {
			resolve(!err);
		});
	});
}

function readFile(filename, dir) {
	filename = path.join(dir, filename);
	return new Promise((resolve, reject) => {
		fs.readFile(filename, 'utf8', (err, data) => {
			if (err) {
				reject(err);
			}
			resolve(data);
		});
	});
}

function runsSuccessfully(command, dir) {
	return new Promise((resolve) => {
		cp.exec(command, {
			cwd: dir,
		}, (error, stdout, stderr) => {
			if (error) {
				console.error(error);
				console.error(stdout);
				console.error(stderr);
			}
			resolve(!error);
		});
	});
}

function installDeps() {
	return new Promise((resolve, reject) => {
		cp.exec('npm install', (error) => {
			if (error) {
				reject(error);
			} else {
				const localDeps = ['react-server-cli', 'react-server']
					.map(dep => path.resolve(path.join(__dirname, '../..', dep)));
				cp.exec('npm install ' + localDeps.join(' '), (error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				});
			}
		});
	});
}
