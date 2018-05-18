const del = require('del');

del(['dist/!(*.umd.js|*.cjs.js|*.cjs.js.map|*.css|*.esm.js|*.d.ts|*.umd.js.map|*.esm.js.map|*.metadata.json)']).then(paths => {
	console.log('Files and folders that would be deleted:\n', paths.join('\n'));
});