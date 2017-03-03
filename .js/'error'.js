'use strict';
const spawn = require('child_process').spawn;

let child = spawn('sh', ['-c',
  `node -e "setInterval(() => {
      console.log(process.pid + 'is alive')
    }, 500);"`
  ], {
    stdio: ['inherit', 'inherit', 'inherit']
  });

setTimeout(() => {
  child.kill(); // does not terminate the node process in the shell
}, 2000);
